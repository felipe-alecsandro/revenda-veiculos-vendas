import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1710000000000 implements MigrationInterface {
  name = 'InitSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id uuid PRIMARY KEY,
        brand varchar(100) NOT NULL,
        model varchar(100) NOT NULL,
        year int NOT NULL,
        color varchar(50) NOT NULL,
        price numeric(12, 2) NOT NULL CHECK (price > 0),
        image_url varchar(2048),
        status varchar(20) NOT NULL DEFAULT 'AVAILABLE',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id uuid PRIMARY KEY,
        vehicle_id uuid NOT NULL REFERENCES vehicles(id),
        buyer_cpf varchar(11) NOT NULL,
        sale_price numeric(12, 2) NOT NULL CHECK (sale_price > 0),
        payment_code varchar(36) NOT NULL UNIQUE,
        status varchar(20) NOT NULL,
        sold_at varchar(50),
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_status_price
      ON vehicles(status, price);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_buyer_cpf ON sales(buyer_cpf);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON sales(vehicle_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sales;`);
    await queryRunner.query(`DROP TABLE IF EXISTS vehicles;`);
  }
}
