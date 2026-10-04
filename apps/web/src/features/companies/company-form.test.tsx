import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyForm, companyToForm, toCompanyPayload } from './company-form';
import { Company } from '@/lib/types';

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 'company-uuid',
    name: 'Acme Genetics',
    phone: '+61400000000',
    email: 'hi@acme.test',
    website: 'https://acme.test',
    billingAddress: {
      line1: '1 Farm Road',
      line2: null,
      country: 'Australia',
      state: 'New South Wales',
      city: 'Dubbo',
      postalCode: '2830',
    },
    shippingSameAsBilling: true,
    shippingAddress: {
      line1: '1 Farm Road',
      line2: null,
      country: 'Australia',
      state: 'New South Wales',
      city: 'Dubbo',
      postalCode: '2830',
    },
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: 'admin-uuid',
    updatedById: 'admin-uuid',
    ...overrides,
  };
}

function renderForm(props: Partial<React.ComponentProps<typeof CompanyForm>> = {}) {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  render(
    <CompanyForm submitLabel="Save" onSubmit={onSubmit} onCancel={onCancel} {...props} />,
  );
  return { onSubmit, onCancel };
}

describe('CompanyForm (spec 2.8.1)', () => {
  it('blocks submit and shows the required-field messages', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Enter a company name')).toBeInTheDocument();
    expect(screen.getByText('Enter a phone number')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid email and an invalid website', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^Name/), 'Acme Genetics');
    await user.type(screen.getByLabelText(/^Phone/), '+61400000000');
    await user.type(screen.getByLabelText(/^Email/), 'nope@');
    await user.type(screen.getByLabelText(/^Website/), 'acme');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid URL.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the entered values once they are valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^Name/), '  Acme Genetics ');
    await user.type(screen.getByLabelText(/^Phone/), '+61 400 000 000');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: '  Acme Genetics ',
      phone: '+61 400 000 000',
    });
  });

  it('hides the shipping address while "same as billing" is checked', async () => {
    const user = userEvent.setup();
    renderForm();

    const sameAsBilling = screen.getByLabelText('Same as billing address');
    expect(sameAsBilling).toBeChecked();
    // Only the billing block is on screen.
    expect(screen.getAllByLabelText('Address Line 1')).toHaveLength(1);

    await user.click(sameAsBilling);

    // Clearing the box reveals a second, independent address block.
    expect(screen.getAllByLabelText('Address Line 1')).toHaveLength(2);
  });

  it('enables State only after Country and City only after State (spec 2.8.1)', async () => {
    const user = userEvent.setup();
    renderForm();

    const state = screen.getByLabelText('State/Province');
    const city = screen.getByLabelText('City');
    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.type(screen.getByLabelText('Country'), 'Australia');
    expect(screen.getByLabelText('State/Province')).toBeEnabled();
    expect(screen.getByLabelText('City')).toBeDisabled();

    await user.type(screen.getByLabelText('State/Province'), 'New South Wales');
    expect(screen.getByLabelText('City')).toBeEnabled();
  });

  it('keeps the Update button disabled until something changes (spec 2.3.1.2)', async () => {
    const user = userEvent.setup();
    renderForm({
      submitLabel: 'Update',
      requireChange: true,
      initialValues: companyToForm(makeCompany()),
    });

    const submit = screen.getByRole('button', { name: 'Update' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/^Name/), ' Pty Ltd');
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();
  });

  it('shows a server error above the form', () => {
    renderForm({ formError: 'A company with this name already exists.' });

    expect(
      screen.getByText('A company with this name already exists.'),
    ).toBeInTheDocument();
  });
});

describe('companyToForm', () => {
  it('turns nulls into empty strings so inputs stay controlled', () => {
    const values = companyToForm(
      makeCompany({
        email: null,
        website: null,
        billingAddress: {
          line1: null,
          line2: null,
          country: null,
          state: null,
          city: null,
          postalCode: null,
        },
      }),
    );

    expect(values.email).toBe('');
    expect(values.website).toBe('');
    expect(values.billingAddress.country).toBe('');
  });
});

describe('toCompanyPayload', () => {
  it('trims values and sends nulls for blanks', () => {
    const payload = toCompanyPayload({
      name: '  Acme  ',
      phone: ' +61400000000 ',
      email: '   ',
      website: '',
      billingAddress: {
        line1: ' 1 Farm Road ',
        line2: '',
        country: 'Australia',
        state: '',
        city: '',
        postalCode: '',
      },
      shippingSameAsBilling: true,
      shippingAddress: {
        line1: 'ignored',
        line2: '',
        country: '',
        state: '',
        city: '',
        postalCode: '',
      },
    });

    expect(payload.name).toBe('Acme');
    expect(payload.email).toBeNull();
    expect(payload.website).toBeNull();
    expect(payload.billingAddress.line1).toBe('1 Farm Road');
    expect(payload.billingAddress.line2).toBeNull();
    // Spec 2.8.1 — shipping mirrors billing while the box stays checked.
    expect(payload.shippingAddress.line1).toBe('1 Farm Road');
  });

  it('sends the distinct shipping address when the box is unchecked', () => {
    const payload = toCompanyPayload({
      name: 'Acme',
      phone: '+61400000000',
      email: '',
      website: '',
      billingAddress: {
        line1: '1 Farm Road',
        line2: '',
        country: '',
        state: '',
        city: '',
        postalCode: '',
      },
      shippingSameAsBilling: false,
      shippingAddress: {
        line1: '9 Depot Street',
        line2: '',
        country: '',
        state: '',
        city: '',
        postalCode: '',
      },
    });

    expect(payload.shippingAddress.line1).toBe('9 Depot Street');
  });
});
