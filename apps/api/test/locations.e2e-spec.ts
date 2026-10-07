import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { ADMIN_PASSWORD, createTestApp, resetDatabase, seedAdmin } from './helpers';

describe('Locations (e2e)', () => {
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

  it('[AC-17] location API flow supports management, listing, references, and company safeguards', async () => {
    const companyResponse = await api()
      .post('/api/companies')
      .set('Authorization', auth())
      .send({
        name: 'Location Test Company',
        phone: '+61400000000',
        billingAddress: { country: 'Australia' },
      })
      .expect(201);
    const companyId = companyResponse.body.id as string;

    const countries = await api()
      .get('/api/locations/reference/countries')
      .set('Authorization', auth())
      .expect(200);
    expect(countries.body).toContain('Australia');

    const states = await api()
      .get('/api/locations/reference/states?country=Australia')
      .set('Authorization', auth())
      .expect(200);
    expect(states.body).toContain('New South Wales');

    const cities = await api()
      .get('/api/locations/reference/cities?country=Australia&stateProvince=New%20South%20Wales')
      .set('Authorization', auth())
      .expect(200);
    expect(cities.body).toContain('Sydney');

    const zeta = await api()
      .post('/api/locations')
      .set('Authorization', auth())
      .send({
        name: 'Zeta Location',
        companyId,
        country: 'Australia',
        stateProvince: 'New South Wales',
        city: 'Sydney',
      })
      .expect(201);
    expect(zeta.body).toMatchObject({ name: 'Zeta Location', isActive: true });

    const alpha = await api()
      .post('/api/locations')
      .set('Authorization', auth())
      .send({
        name: 'Alpha Location',
        companyId,
        country: 'Australia',
        stateProvince: 'New South Wales',
        city: 'Sydney',
      })
      .expect(201);
    expect(alpha.body).toMatchObject({ name: 'Alpha Location', companyId });

    const defaultList = await api()
      .get('/api/locations')
      .set('Authorization', auth())
      .expect(200);
    expect(defaultList.body).toMatchObject({ total: 2, page: 1, perPage: 50 });
    expect(defaultList.body.data.map((location: { name: string }) => location.name)).toEqual([
      'Alpha Location',
      'Zeta Location',
    ]);

    const countryFilter = await api()
      .get('/api/locations?country=Australia')
      .set('Authorization', auth())
      .expect(200);
    expect(countryFilter.body.total).toBe(2);

    const companyFilter = await api()
      .get(`/api/locations?companyId=${companyId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(companyFilter.body.total).toBe(2);

    const searchFilter = await api()
      .get('/api/locations?search=alpha')
      .set('Authorization', auth())
      .expect(200);
    expect(searchFilter.body.data.map((location: { id: string }) => location.id)).toEqual([
      alpha.body.id,
    ]);

    const retrieved = await api()
      .get(`/api/locations/${alpha.body.id}`)
      .set('Authorization', auth())
      .expect(200);
    expect(retrieved.body).toMatchObject({
      id: alpha.body.id,
      name: 'Alpha Location',
      country: 'Australia',
      city: 'Sydney',
    });

    const updated = await api()
      .patch(`/api/locations/${alpha.body.id}`)
      .set('Authorization', auth())
      .send({ name: 'Alpha Location Updated', city: 'Newcastle' })
      .expect(200);
    expect(updated.body).toMatchObject({ name: 'Alpha Location Updated', city: 'Newcastle' });

    const deactivated = await api()
      .patch(`/api/locations/${zeta.body.id}/status`)
      .set('Authorization', auth())
      .send({ isActive: false })
      .expect(200);
    expect(deactivated.body.isActive).toBe(false);

    const activeList = await api()
      .get('/api/locations')
      .set('Authorization', auth())
      .expect(200);
    expect(activeList.body.data.map((location: { name: string }) => location.name)).toEqual([
      'Alpha Location Updated',
    ]);

    const inactiveList = await api()
      .get('/api/locations?status=INACTIVE')
      .set('Authorization', auth())
      .expect(200);
    expect(inactiveList.body.data.map((location: { name: string }) => location.name)).toEqual([
      'Zeta Location',
    ]);

    const reactivated = await api()
      .patch(`/api/locations/${zeta.body.id}/status`)
      .set('Authorization', auth())
      .send({ isActive: true })
      .expect(200);
    expect(reactivated.body.isActive).toBe(true);

    const companyDetails = await api()
      .get(`/api/companies/${companyId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(companyDetails.body.locations.map((location: { name: string }) => location.name)).toEqual([
      'Alpha Location Updated',
      'Zeta Location',
    ]);

    await api()
      .delete(`/api/companies/${companyId}`)
      .set('Authorization', auth())
      .expect(400);
    await api()
      .get(`/api/companies/${companyId}`)
      .set('Authorization', auth())
      .expect(200);
  });
});
