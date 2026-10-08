import { getMetadataArgsStorage } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Location } from './location.entity';

describe('Location entity', () => {
  it('[AC-10] stores an optional Company ID and supports multiple Locations per Company', () => {
    const company = Object.assign(new Company(), { id: 'c-company-id' });
    const associated = Object.assign(new Location(), {
      id: 'c-location-one',
      companyId: company.id,
      company,
    });
    const unassociated = Object.assign(new Location(), {
      id: 'c-location-two',
      companyId: null,
      company: null,
    });
    company.locations = [associated, unassociated];

    const relations = getMetadataArgsStorage().relations;
    const companyLocations = relations.find(
      (relation) => relation.target === Company && relation.propertyName === 'locations',
    );
    const locationCompany = relations.find(
      (relation) => relation.target === Location && relation.propertyName === 'company',
    );

    expect(associated.companyId).toBe(company.id);
    expect(unassociated.companyId).toBeNull();
    expect(company.locations).toHaveLength(2);
    expect(companyLocations?.relationType).toBe('one-to-many');
    expect(locationCompany?.relationType).toBe('many-to-one');
    expect(locationCompany?.options?.nullable).toBe(true);
  });
});
