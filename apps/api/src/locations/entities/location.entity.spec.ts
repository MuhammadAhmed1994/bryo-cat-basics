import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Location } from './location.entity';

describe('Location entity', () => {
  it('[AC-10] supports an optional Company and multiple Locations per Company', () => {
    const location = Object.assign(new Location(), { companyId: 'company-123' });
    const secondLocation = Object.assign(new Location(), { companyId: 'company-123' });
    const unassociatedLocation = Object.assign(new Location(), { companyId: null });
    const company = Object.assign(new Company(), {
      id: 'company-123',
      locations: [location, secondLocation],
    });

    const metadata = getMetadataArgsStorage();
    const companyIdColumn = metadata.columns.find(
      (column) => column.target === Location && column.propertyName === 'companyId',
    );
    const locationCompanyRelation = metadata.relations.find(
      (relation) => relation.target === Location && relation.propertyName === 'company',
    );
    const companyLocationsRelation = metadata.relations.find(
      (relation) => relation.target === Company && relation.propertyName === 'locations',
    );

    expect(companyIdColumn?.options.nullable).toBe(true);
    expect(location.companyId).toBe(company.id);
    expect(unassociatedLocation.companyId).toBeNull();
    expect(locationCompanyRelation?.relationType).toBe('many-to-one');
    expect(companyLocationsRelation?.relationType).toBe('one-to-many');
    expect(company.locations).toHaveLength(2);
    expect(company.locations.every((item) => item.companyId === company.id)).toBe(true);
  });
});
