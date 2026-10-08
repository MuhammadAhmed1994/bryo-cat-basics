import { Company } from '../../companies/entities/company.entity';
import { Location } from './location.entity';

describe('Location entity', () => {
  it('[AC-10] stores an optional Company ID and supports multiple Locations per Company', () => {
    const company = Object.assign(new Company(), { id: 'company-id' });
    const firstLocation = Object.assign(new Location(), {
      id: 'c012345678901234567890123',
      name: 'North Farm',
      nameNormalized: 'north farm',
      companyId: company.id,
      company,
    });
    const secondLocation = Object.assign(new Location(), {
      id: 'c123456789012345678901234',
      name: 'South Farm',
      nameNormalized: 'south farm',
      companyId: company.id,
      company,
    });
    const unassociatedLocation = Object.assign(new Location(), {
      id: 'c234567890123456789012345',
      name: 'West Farm',
      nameNormalized: 'west farm',
      companyId: null,
      company: null,
    });
    company.locations = [firstLocation, secondLocation];

    expect(firstLocation.companyId).toBe(company.id);
    expect(unassociatedLocation.companyId).toBeNull();
    expect(company.locations).toHaveLength(2);
    expect(company.locations.every((location) => location.companyId === company.id)).toBe(true);
  });
});
