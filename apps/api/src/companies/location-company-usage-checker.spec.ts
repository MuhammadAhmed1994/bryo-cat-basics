import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from '../locations/entities/location.entity';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';

describe('LocationCompanyUsageChecker', () => {
  it('[AC-10] protects a Company referenced by one or more Locations from deletion', async () => {
    const locations = { count: jest.fn().mockResolvedValue(2) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationCompanyUsageChecker,
        { provide: getRepositoryToken(Location), useValue: locations },
      ],
    }).compile();
    const checker = moduleRef.get(LocationCompanyUsageChecker);

    await expect(checker.countForCompany('company-123')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(locations.count).toHaveBeenCalledWith({ where: { companyId: 'company-123' } });
  });
});
