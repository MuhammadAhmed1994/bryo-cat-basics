import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './pagination';

describe('Pagination (spec 2.2.7)', () => {
  it('reports the visible range and total', () => {
    render(
      <Pagination
        total={438}
        page={1}
        perPage={50}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Showing 1–50 of 438 records')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('caps the range at the total on the last page', () => {
    render(
      <Pagination
        total={438}
        page={9}
        perPage={50}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Showing 401–438 of 438 records')).toBeInTheDocument();
  });

  it('shows a zero range when there are no records', () => {
    render(
      <Pagination
        total={0}
        page={1}
        perPage={50}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Showing 0–0 of 0 records')).toBeInTheDocument();
  });

  it('disables Prev on the first page and Next on the last', () => {
    const { unmount } = render(
      <Pagination
        total={60}
        page={1}
        perPage={50}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    unmount();

    render(
      <Pagination
        total={60}
        page={2}
        perPage={50}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Prev' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('jumps straight to a numbered page', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <Pagination
        total={438}
        page={1}
        perPage={50}
        onPageChange={onPageChange}
        onPerPageChange={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('moves between pages', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <Pagination
        total={200}
        page={2}
        perPage={50}
        onPageChange={onPageChange}
        onPerPageChange={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Prev' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('offers 25 / 50 / 100 rows per page', async () => {
    const user = userEvent.setup();
    const onPerPageChange = jest.fn();
    render(
      <Pagination
        total={200}
        page={1}
        perPage={50}
        onPageChange={jest.fn()}
        onPerPageChange={onPerPageChange}
      />,
    );

    const select = screen.getByLabelText('Rows per page');
    expect(select).toHaveValue('50');

    await user.selectOptions(select, '100');
    expect(onPerPageChange).toHaveBeenCalledWith(100);
  });
});
