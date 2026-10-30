/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

const TOKEN = 'test-internal-token';
const CPF = '52998224725';

describe('Sales service (e2e)', () => {
  let app: INestApplication;
  const cheapId = randomUUID();
  const expensiveId = randomUUID();
  const removableId = randomUUID();
  let paymentCode = '';
  let secondPaymentCode = '';

  beforeAll(async () => {
    process.env.INTERNAL_API_TOKEN = TOKEN;
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  const upsert = (
    id: string,
    price: number,
    extra: Record<string, unknown> = {},
  ) =>
    request(server())
      .put(`/v1/integration/vehicles/${id}`)
      .set('x-internal-token', TOKEN)
      .send({
        brand: 'Fiat',
        model: 'Mobi',
        year: 2022,
        color: 'Branco',
        price,
        ...extra,
      });

  it('answers health', async () => {
    const response = await request(server()).get('/v1/health').expect(200);
    expect(response.body.service).toBe('revenda-veiculos-vendas');
  });

  it('rejects catalog sync without the internal token', async () => {
    await request(server())
      .put(`/v1/integration/vehicles/${cheapId}`)
      .send({
        brand: 'Fiat',
        model: 'Mobi',
        year: 2022,
        color: 'Branco',
        price: 40000,
      })
      .expect(401);
  });

  it('lists available vehicles from cheapest to most expensive', async () => {
    await upsert(expensiveId, 90000).expect(200);
    await upsert(cheapId, 40000, {
      imageUrl: 'http://localhost:3001/uploads/mobi.png',
    }).expect(200);

    const available = await request(server()).get('/v1/vehicles').expect(200);
    expect(available.body).toHaveLength(2);
    expect(available.body[0].id).toBe(cheapId);
    expect(available.body[0].price).toBe(40000);
    expect(available.body[0].imageUrl).toBe(
      'http://localhost:3001/uploads/mobi.png',
    );
    expect(available.body[1].id).toBe(expensiveId);
    expect(Number(available.body[0].price)).toBeLessThan(
      Number(available.body[1].price),
    );

    const sold = await request(server()).get('/v1/vehicles/sold').expect(200);
    expect(sold.body).toEqual([]);
  });

  it('rejects an invalid cpf and a missing vehicle', async () => {
    await request(server())
      .post('/v1/sales')
      .send({ vehicleId: cheapId, cpf: '11111111111' })
      .expect(400);

    await request(server())
      .post('/v1/sales')
      .send({ vehicleId: randomUUID(), cpf: CPF })
      .expect(404);

    await request(server()).get('/v1/sales').expect(400);
    await request(server()).get('/v1/sales').query({ cpf: '123' }).expect(400);
  });

  it('reserves a vehicle and confirms payment once', async () => {
    const purchase = await request(server())
      .post('/v1/sales')
      .send({ vehicleId: cheapId, cpf: '529.982.247-25' })
      .expect(201);

    paymentCode = purchase.body.paymentCode;
    expect(purchase.body.status).toBe('PENDING');
    expect(purchase.body.buyerCpf).toBe(CPF);
    expect(purchase.body.soldAt).toBeNull();

    const available = await request(server()).get('/v1/vehicles').expect(200);
    expect(available.body.map((item: { id: string }) => item.id)).not.toContain(
      cheapId,
    );

    await request(server())
      .post('/v1/sales')
      .send({ vehicleId: cheapId, cpf: CPF })
      .expect(409);

    await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode: randomUUID(), status: 'PAID' })
      .expect(404);

    const paid = await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode, status: 'PAID' })
      .expect(200);
    expect(paid.body.status).toBe('PAID');
    expect(paid.body.soldAt).toEqual(expect.any(String));

    const repeated = await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode, status: 'PAID' })
      .expect(200);
    expect(repeated.body.status).toBe('PAID');
    expect(repeated.body.soldAt).toBe(paid.body.soldAt);

    await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode, status: 'CANCELLED' })
      .expect(409);

    const sold = await request(server()).get('/v1/vehicles/sold').expect(200);
    expect(sold.body).toHaveLength(1);
    expect(sold.body[0].id).toBe(cheapId);
    expect(sold.body[0].price).toBe(40000);
    expect(sold.body[0].buyerCpf).toBe(CPF);
    expect(sold.body[0].status).toBe('SOLD');

    const history = await request(server())
      .get('/v1/sales')
      .query({ cpf: CPF })
      .expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].vehicle.model).toBe('Mobi');
  });

  it('keeps sold status when the catalog is updated and blocks removal', async () => {
    await upsert(cheapId, 45000, { color: 'Vermelho' }).expect(200);

    const available = await request(server()).get('/v1/vehicles').expect(200);
    expect(available.body.map((item: { id: string }) => item.id)).not.toContain(
      cheapId,
    );

    const sold = await request(server()).get('/v1/vehicles/sold').expect(200);
    expect(sold.body[0].color).toBe('Vermelho');
    expect(sold.body[0].price).toBe(40000);
    expect(sold.body[0].status).toBe('SOLD');

    await request(server())
      .delete(`/v1/integration/vehicles/${cheapId}`)
      .set('x-internal-token', TOKEN)
      .expect(409);
  });

  it('cancels a payment, allows a new purchase, and deletes an available vehicle', async () => {
    const purchase = await request(server())
      .post('/v1/sales')
      .send({ vehicleId: expensiveId, cpf: CPF })
      .expect(201);
    secondPaymentCode = purchase.body.paymentCode;

    const cancelled = await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode: secondPaymentCode, status: 'CANCELLED' })
      .expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');

    const repeated = await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode: secondPaymentCode, status: 'CANCELLED' })
      .expect(200);
    expect(repeated.body.status).toBe('CANCELLED');

    await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode: secondPaymentCode, status: 'PAID' })
      .expect(409);

    const available = await request(server()).get('/v1/vehicles').expect(200);
    expect(available.body.map((item: { id: string }) => item.id)).toContain(
      expensiveId,
    );

    await upsert(removableId, 10000).expect(200);
    await request(server())
      .delete(`/v1/integration/vehicles/${removableId}`)
      .set('x-internal-token', TOKEN)
      .expect(204);
    await request(server())
      .delete(`/v1/integration/vehicles/${removableId}`)
      .set('x-internal-token', TOKEN)
      .expect(404);

    const afterDelete = await request(server()).get('/v1/vehicles').expect(200);
    expect(
      afterDelete.body.map((item: { id: string }) => item.id),
    ).not.toContain(removableId);

    const reserved = await request(server())
      .post('/v1/sales')
      .send({ vehicleId: expensiveId, cpf: CPF })
      .expect(201);
    await request(server())
      .delete(`/v1/integration/vehicles/${expensiveId}`)
      .set('x-internal-token', TOKEN)
      .expect(409);
    await request(server())
      .post('/v1/payments/webhook')
      .send({ paymentCode: reserved.body.paymentCode, status: 'CANCELLED' })
      .expect(200);
    await request(server())
      .delete(`/v1/integration/vehicles/${expensiveId}`)
      .set('x-internal-token', TOKEN)
      .expect(204);
  });
});
