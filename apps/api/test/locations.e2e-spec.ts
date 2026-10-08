import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { ADMIN_PASSWORD, createTestApp, resetDatabase, seedAdmin } from './helpers';

describe('Locations API (e2e)', () => {
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
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'admin@nbryo.test', password: ADMIN_PASSWORD })
      .expect(200);
    token = login.body.accessToken;
  });

  const api = () => request(app.getHttpServer());
  const auth = () => `Bearer ${token}`;

  it('[AC-17] supports the authenticated location API flow and company safeguards', async () => {
    const companyResponse = await api()
      .post('/api/companies')
      .set('Authorization', auth())
      .send({
        name: 'Location Parent Company',
        phone: '+61400000000',
        billingAddress: { country: 'Australia' },
      })
      .expect(201);
    const companyId = companyResponse.body.id as string;

    const createdA = await api()
      .post('/api/locations')
      .set('Authorization', auth())
      .send({
        name: 'Alpha Clinic',
        companyId,
        country: 'Australia',
        stateProvince: 'New South Wales',
        city: 'Sydney',
      })
      .expect(201);
    expect(createdA.body).toMatchObject({ name: 'Alpha Clinic', isActive: true });

    const createdZ = await api()
      .post('/api/locations')
      .set('Authorization', auth())
      .send({
        name: 'Zulu Clinic',
        companyId,
        country: 'Australia',
        stateProvince: 'Victoria',
        city: 'Melbourne',
      })
      .expect(201);
    const createdOtherCountry = await api()
      .post('/api/locations')
      .set('Authorization', auth())
      .send({ name: 'Bravo Clinic', country: 'New Zealand' })
      .expect(201);

    const fetched = await api()
      .get(`/api/locations/${createdA.body.id}`)
      .set('Authorization', auth())
      .expect(200);
    expect(fetched.body).toMatchObject({
      name: 'Alpha Clinic',
      companyId,
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Sydney',
      isActive: true,
    });
    expect(fetched.body.createdAt).toBeTruthy();
    expect(fetched.body.updatedAt).toBeTruthy();

    const updated = await api()
      .patch(`/api/locations/${createdA.body.id}`)
      .set('Authorization', auth())
      .send({ name: 'Alpha Clinic Updated', city: 'Newcastle' })
      .expect(200);
    expect(updated.body).toMatchObject({
      name: 'Alpha Clinic Updated',
      city: 'Newcastle',
      message: 'Location updated successfully.',
    });

    const deactivated = await api()
      .patch(`/api/locations/${createdZ.body.id}/status`)
      .set('Authorization', auth())
      .send({ isActive: false })
      .expect(200);
    expect(deactivated.body).toMatchObject({
      isActive: false,
      message: 'Location deactivated successfully.',
    });
    const reactivated = await api()
      .patch(`/api/locations/${createdZ.body.id}/status`)
      .set('Authorization', auth())
      .send({ isActive: true })
      .expect(200);
    expect(reactivated.body).toMatchObject({
      isActive: true,
      message: 'Location activated successfully.',
    });

    const defaults = await api()
      .get('/api/locations')
      .set('Authorization', auth())
      .expect(200);
    expect(defaults.body).toMatchObject({ total: 3, page: 1, perPage: 50 });
    expect(defaults.body.data.map((location: { name: string }) => location.name)).toEqual([
      'Alpha Clinic Updated',
      'Bravo Clinic',
      'Zulu Clinic',
    ]);

    const inactive = await api()
      .get('/api/locations?status=INACTIVE')
      .set('Authorization', auth())
      .expect(200);
    expect(inactive.body.data).toHaveLength(0);
    const all = await api()
      .get('/api/locations?status=ALL')
      .set('Authorization', auth())
      .expect(200);
    expect(all.body.total).toBe(3);

    const searched = await api()
      .get('/api/locations?search=updated')
      .set('Authorization', auth())
      .expect(200);
    expect(searched.body.data.map((location: { id: string }) => location.id)).toEqual([
      createdA.body.id,
    ]);

    const countryFiltered = await api()
      .get('/api/locations?country=Australia')
      .set('Authorization', auth())
      .expect(200);
    expect(countryFiltered.body.data.map((location: { name: string }) => location.name)).toEqual([
      'Alpha Clinic Updated',
      'Zulu Clinic',
    ]);
    const companyFiltered = await api()
      .get(`/api/locations?companyId=${companyId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(companyFiltered.body.total).toBe(2);

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

    const company = await api()
      .get(`/api/companies/${companyId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(company.body.locations.map((location: { name: string }) => location.name)).toEqual([
      'Alpha Clinic Updated',
      'Zulu Clinic',
    ]);

    await api()
      .delete(`/api/companies/${companyId}`)
      .set('Authorization', auth())
      .expect(400);
    const retainedCompany = await api()
      .get(`/api/companies/${companyId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(retainedCompany.body.id).toBe(companyId);

    // Also ensure the independently associated, unfiltered location was created.
    expect(createdOtherCountry.body.id).toBeTruthy();
  });
});
