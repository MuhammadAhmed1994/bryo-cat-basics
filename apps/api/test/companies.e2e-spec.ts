import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { ADMIN_PASSWORD, createTestApp, resetDatabase, seedAdmin } from './helpers';

const VALID = {
  name: 'Acme Genetics',
  phone: '+61400000000',
  email: 'hello@acme.test',
  website: 'https://acme.test',
  billingAddress: {
    line1: '1 Farm Road',
    country: 'Australia',
    state: 'New South Wales',
    city: 'Dubbo',
    postalCode: '2830',
  },
};

describe('Companies (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    dataSource = ctx.dataSource;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    await seedAdmin(dataSource);
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'admin@nbryo.test', password: ADMIN_PASSWORD })
      .expect(200);
    token = res.body.accessToken;
  });

  const api = () => request(app.getHttpServer());
  const auth = () => `Bearer ${token}`;

  const createCompany = (overrides: Record<string, unknown> = {}) =>
    api()
      .post('/api/companies')
      .set('Authorization', auth())
      .send({ ...VALID, ...overrides });

  it('requires authentication (spec 2.1.4)', async () => {
    await api().get('/api/companies').expect(401);
  });

  describe('POST /api/companies (spec 2.8.1)', () => {
    it('creates an active company and copies billing into shipping', async () => {
      const res = await createCompany().expect(201);

      expect(res.body).toMatchObject({
        name: 'Acme Genetics',
        isActive: true,
        shippingSameAsBilling: true,
        message: 'Company added successfully',
      });
      expect(res.body.billingAddress.city).toBe('Dubbo');
      expect(res.body.shippingAddress.city).toBe('Dubbo');
      expect(res.body.createdById).toBeTruthy();
    });

    it('keeps a separate shipping address when the box is unchecked', async () => {
      const res = await createCompany({
        shippingSameAsBilling: false,
        shippingAddress: { line1: '9 Depot Street', country: 'Australia', city: 'Orange' },
      }).expect(201);

      expect(res.body.shippingAddress.city).toBe('Orange');
      expect(res.body.billingAddress.city).toBe('Dubbo');
    });

    it('rejects a missing name', async () => {
      const res = await createCompany({ name: '' }).expect(400);
      expect(res.body.message).toContain('Enter a company name');
    });

    it('rejects a name over 100 characters', async () => {
      const res = await createCompany({ name: 'a'.repeat(101) }).expect(400);
      expect(res.body.message).toContain('Name cannot exceed 100 characters.');
    });

    it('rejects a duplicate name regardless of case (spec 2.8.1)', async () => {
      await createCompany().expect(201);

      const res = await createCompany({ name: 'acme GENETICS' }).expect(409);
      expect(res.body.message).toBe('A company with this name already exists.');
    });

    it('rejects an invalid email', async () => {
      const res = await createCompany({ email: 'nope@' }).expect(400);
      expect(res.body.message).toContain('Enter a valid email address.');
    });

    it('rejects an invalid phone number', async () => {
      const res = await createCompany({ phone: 'call me' }).expect(400);
      expect(res.body.message).toContain('Enter a valid phone number.');
    });
  });

  describe('GET /api/companies (spec 2.8.7)', () => {
    beforeEach(async () => {
      await createCompany({ name: 'Zeta Farms', billingAddress: { country: 'Australia' } });
      await createCompany({ name: 'Acme Genetics' });
      await createCompany({ name: 'Bravo Cattle', billingAddress: { country: 'New Zealand' } });
    });

    it('lists active companies sorted by name A-Z, 50 per page', async () => {
      const res = await api().get('/api/companies').set('Authorization', auth()).expect(200);

      expect(res.body.data.map((c: { name: string }) => c.name)).toEqual([
        'Acme Genetics',
        'Bravo Cattle',
        'Zeta Farms',
      ]);
      expect(res.body).toMatchObject({ total: 3, page: 1, perPage: 50 });
    });

    it('sorts descending on request', async () => {
      const res = await api()
        .get('/api/companies?sortDir=DESC')
        .set('Authorization', auth())
        .expect(200);

      expect(res.body.data[0].name).toBe('Zeta Farms');
    });

    it('searches by partial name, case-insensitively', async () => {
      const res = await api()
        .get('/api/companies?search=%20ACM%20')
        .set('Authorization', auth())
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].name).toBe('Acme Genetics');
    });

    it('filters by country', async () => {
      const res = await api()
        .get('/api/companies?country=New%20Zealand')
        .set('Authorization', auth())
        .expect(200);

      expect(res.body.data.map((c: { name: string }) => c.name)).toEqual(['Bravo Cattle']);
    });

    it('paginates with the allowed page sizes', async () => {
      const res = await api()
        .get('/api/companies?perPage=25&page=2')
        .set('Authorization', auth())
        .expect(200);

      expect(res.body).toMatchObject({ total: 3, page: 2, perPage: 25 });
      expect(res.body.data).toHaveLength(0);
    });

    it('rejects a page size outside 25/50/100', async () => {
      await api().get('/api/companies?perPage=7').set('Authorization', auth()).expect(400);
    });

    it('hides deactivated companies by default and finds them under Inactive', async () => {
      const list = await api().get('/api/companies').set('Authorization', auth());
      const zeta = list.body.data.find((c: { name: string }) => c.name === 'Zeta Farms');

      await api()
        .patch(`/api/companies/${zeta.id}/status`)
        .set('Authorization', auth())
        .send({ isActive: false })
        .expect(200);

      const active = await api().get('/api/companies').set('Authorization', auth());
      expect(active.body.total).toBe(2);

      const inactive = await api()
        .get('/api/companies?status=INACTIVE')
        .set('Authorization', auth());
      expect(inactive.body.data.map((c: { name: string }) => c.name)).toEqual(['Zeta Farms']);

      const all = await api().get('/api/companies?status=ALL').set('Authorization', auth());
      expect(all.body.total).toBe(3);
    });
  });

  describe('GET /api/companies/:id (spec 2.8.2)', () => {
    it('returns the record with its audit fields', async () => {
      const created = await createCompany().expect(201);

      const res = await api()
        .get(`/api/companies/${created.body.id}`)
        .set('Authorization', auth())
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Acme Genetics', isActive: true });
      expect(res.body.createdAt).toBeTruthy();
      expect(res.body.updatedById).toBeTruthy();
    });

    it('404s for a company that does not exist', async () => {
      await api()
        .get('/api/companies/00000000-0000-4000-8000-000000000000')
        .set('Authorization', auth())
        .expect(404);
    });
  });

  describe('PATCH /api/companies/:id (spec 2.8.3)', () => {
    it('updates fields and returns the success message', async () => {
      const created = await createCompany().expect(201);

      const res = await api()
        .patch(`/api/companies/${created.body.id}`)
        .set('Authorization', auth())
        .send({ name: 'Acme Genetics Pty Ltd', phone: '+61411111111' })
        .expect(200);

      expect(res.body).toMatchObject({
        name: 'Acme Genetics Pty Ltd',
        phone: '+61411111111',
        message: 'Company updated successfully.',
      });
    });

    it('lets a company keep its own name', async () => {
      const created = await createCompany().expect(201);

      await api()
        .patch(`/api/companies/${created.body.id}`)
        .set('Authorization', auth())
        .send({ name: 'Acme Genetics' })
        .expect(200);
    });

    it('rejects renaming onto an existing company', async () => {
      const first = await createCompany().expect(201);
      await createCompany({ name: 'Bravo Cattle' }).expect(201);

      const res = await api()
        .patch(`/api/companies/${first.body.id}`)
        .set('Authorization', auth())
        .send({ name: 'bravo cattle' })
        .expect(409);

      expect(res.body.message).toBe('A company with this name already exists.');
    });

    it('re-syncs shipping when the same-as-billing box is re-checked', async () => {
      const created = await createCompany({
        shippingSameAsBilling: false,
        shippingAddress: { line1: '9 Depot Street', city: 'Orange' },
      }).expect(201);

      const res = await api()
        .patch(`/api/companies/${created.body.id}`)
        .set('Authorization', auth())
        .send({ shippingSameAsBilling: true })
        .expect(200);

      expect(res.body.shippingAddress.city).toBe('Dubbo');
    });
  });

  describe('PATCH /api/companies/:id/status (spec 2.8.5)', () => {
    it('deactivates and reactivates with the spec messages', async () => {
      const created = await createCompany().expect(201);

      const off = await api()
        .patch(`/api/companies/${created.body.id}/status`)
        .set('Authorization', auth())
        .send({ isActive: false })
        .expect(200);
      expect(off.body).toMatchObject({
        isActive: false,
        message: 'Company deactivated successfully.',
      });

      const on = await api()
        .patch(`/api/companies/${created.body.id}/status`)
        .set('Authorization', auth())
        .send({ isActive: true })
        .expect(200);
      expect(on.body).toMatchObject({
        isActive: true,
        message: 'Company activated successfully.',
      });
    });
  });

  describe('DELETE /api/companies/:id (spec 2.8.4)', () => {
    it('deletes an unreferenced company', async () => {
      const created = await createCompany().expect(201);

      const res = await api()
        .delete(`/api/companies/${created.body.id}`)
        .set('Authorization', auth())
        .expect(200);

      expect(res.body.message).toBe('Company deleted successfully.');
      await api()
        .get(`/api/companies/${created.body.id}`)
        .set('Authorization', auth())
        .expect(404);
    });

    it('404s when deleting something that is already gone', async () => {
      await api()
        .delete('/api/companies/00000000-0000-4000-8000-000000000000')
        .set('Authorization', auth())
        .expect(404);
    });
  });
});
