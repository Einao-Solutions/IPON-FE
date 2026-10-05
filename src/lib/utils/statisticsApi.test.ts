import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { statisticsApi, type PerformanceRange } from './statisticsApi';

vi.mock('$lib/helpers', () => ({ baseURL: 'https://example.test' }));
vi.mock('$lib/store', () => ({ loggedInToken: {} }));
vi.mock('svelte/store', () => ({ get: () => 'test-token' }));

const fetchMock = vi.fn();

function mockReport(periodType: string) {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
        success: true,
        data: {
            unitId: 1,
            unitName: 'Search',
            registryType: 'Trademark',
            period: { type: periodType, value: '', year: 2026 },
            summary: { totalAssigned: 0, totalTreated: 0, treatmentRate: 0 },
            staffPerformance: [],
            overview: { totalUnits: 0, totalAssigned: 0, totalTreated: 0, overallRate: 0 },
            units: []
        }
    }), { status: 200 }));
}

describe('performance periods', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('preserves required period parameters alongside year bounds', async () => {
        mockReport('year-range');
        await statisticsApi.getStaffPerformance('Trademark', 1, 'year-range', '2026', 2026, { startYear: 2023, endYear: 2026 });
        const query = new URL(fetchMock.mock.calls[0][0]).searchParams;
        expect(query.get('registryType')).toBe('TradeMark');
        expect(query.get('unitId')).toBe('1');
        expect(query.get('periodType')).toBe('year-range');
        expect(query.get('startYear')).toBe('2023');
        expect(query.get('endYear')).toBe('2026');
        expect(query.get('year')).toBe('2026');
        expect(query.get('periodValue')).toBe('2026');
    });

    it('accepts a range with the same start and end year', async () => {
        mockReport('year-range');
        await expect(statisticsApi.getStaffPerformance('Patent', 1, 'year-range', '', 2026, { startYear: 2026, endYear: 2026 })).resolves.toBeDefined();
    });

    it('rejects reversed ranges before fetching', async () => {
        await expect(statisticsApi.getStaffPerformance('Trademark', 1, 'year-range', '', 2026, { startYear: 2026, endYear: 2023 })).rejects.toThrow('valid year range');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('requires bounds for a year-range request', async () => {
        await expect(statisticsApi.getStaffPerformance('Trademark', 1, 'year-range', '', 2026)).rejects.toThrow('valid year range');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('preserves the backend response without enforcing a new period format', async () => {
        mockReport('year');
        await expect(statisticsApi.getStaffPerformance('Trademark', 1, 'year-range', '2026', 2026, { startYear: 2023, endYear: 2026 })).resolves.toMatchObject({ period: { type: 'year' } });
    });

    it('preserves the existing month query and authentication header', async () => {
        mockReport('month');
        await statisticsApi.getStaffPerformance('Trademark', 1, 'month', 'October', 2026);
        const query = new URL(fetchMock.mock.calls[0][0]).searchParams;
        expect(query.get('periodValue')).toBe('October');
        expect(query.get('year')).toBe('2026');
        expect(query.has('startYear')).toBe(false);
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('posts unit comparison periods with the required type and existing period fields', async () => {
        const data = { registryType: 'TradeMark', periods: [] };
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 200 }));
        await expect(statisticsApi.compareUnitPerformance('Trademark', [
            { periodType: 'month', periodValue: 'January', year: 2026 },
            { periodType: 'quarter', periodValue: 'Q2: Apr-Jun', year: 2026 },
            { periodType: 'year-range', periodValue: '2026', year: 2026, startYear: 2023, endYear: 2026 },
            { periodType: 'date-range', periodValue: '2026', year: 2026, startDate: '2026-01-15', endDate: '2026-10-05' }
        ])).resolves.toEqual(data);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('https://example.test/api/statistics/performance/units/compare');
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer test-token');
        const body = JSON.parse(options.body);
        expect(body.registryType).toBe('TradeMark');
        expect(body.periods).toEqual([
            { type: 'month', periodType: 'month', periodValue: 'January', year: 2026 },
            { type: 'quarter', periodType: 'quarter', periodValue: 'Q2: Apr-Jun', year: 2026 },
            { type: 'year-range', periodType: 'year-range', periodValue: '2026', year: 2026, startYear: 2023, endYear: 2026 },
            { type: 'date-range', periodType: 'date-range', periodValue: '2026', year: 2026, startDate: '2026-01-15', endDate: '2026-10-05' }
        ]);
    });

    it('does not fetch a unit comparison with fewer than two periods', async () => {
        await expect(statisticsApi.compareUnitPerformance('Patent', [{ periodType: 'month', periodValue: 'January', year: 2026 }])).rejects.toThrow('between 2 and 5');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not fetch a unit comparison with more than five periods', async () => {
        await expect(statisticsApi.compareUnitPerformance('Patent', Array.from({ length: 6 }, () => ({ periodType: 'month', periodValue: 'January', year: 2026 })))).rejects.toThrow('between 2 and 5');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces the backend error from a unit comparison', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false, error: 'Missing required parameter: type' }), { status: 400 }));
        await expect(statisticsApi.compareUnitPerformance('Patent', [
            { periodType: 'month', periodValue: 'January', year: 2026 },
            { periodType: 'month', periodValue: 'February', year: 2026 }
        ])).rejects.toThrow('Missing required parameter: type');
    });

    const endpoints = [
        { name: 'staff', request: (type: string, range?: PerformanceRange) => statisticsApi.getStaffPerformance('Trademark', 1, type, type === 'quarter' ? 'Q4: Oct-Dec' : 'October', 2026, range) },
        { name: 'units', request: (type: string, range?: PerformanceRange) => statisticsApi.getUnitPerformance('Trademark', type, type === 'quarter' ? 'Q4: Oct-Dec' : 'October', 2026, range) }
    ];

    for (const endpoint of endpoints) {
        it(`${endpoint.name}: preserves required parameters alongside exact dates`, async () => {
            mockReport('date-range');
            await endpoint.request('date-range', { startDate: '2026-01-15', endDate: '2026-10-05' });
            const url = new URL(fetchMock.mock.calls[0][0]);
            expect(url.pathname).toBe(`/api/statistics/performance/${endpoint.name}`);
            expect(url.searchParams.get('startDate')).toBe('2026-01-15');
            expect(url.searchParams.get('endDate')).toBe('2026-10-05');
            expect(url.searchParams.get('year')).toBe('2026');
            expect(url.searchParams.get('periodValue')).toBe('October');
        });

        it(`${endpoint.name}: accepts a single-day range`, async () => {
            mockReport('date-range');
            await expect(endpoint.request('date-range', { startDate: '2026-10-05', endDate: '2026-10-05' })).resolves.toBeDefined();
        });

        it.each([
            undefined,
            { startDate: '2026-10-05' },
            { startDate: '2026-10-05', endDate: '2026-01-15' },
            { startDate: '2026-02-30', endDate: '2026-10-05' }
        ])(`${endpoint.name}: rejects invalid date bounds %j`, async range => {
            await expect(endpoint.request('date-range', range)).rejects.toThrow('valid date range');
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it(`${endpoint.name}: preserves successful backend responses for dates`, async () => {
            mockReport('month');
            await expect(endpoint.request('date-range', { startDate: '2026-01-15', endDate: '2026-10-05' })).resolves.toMatchObject({ period: { type: 'month' } });
        });

        it(`${endpoint.name}: sends year bounds`, async () => {
            mockReport('year-range');
            await endpoint.request('year-range', { startYear: 2023, endYear: 2026 });
            const query = new URL(fetchMock.mock.calls[0][0]).searchParams;
            expect(query.get('startYear')).toBe('2023');
            expect(query.get('endYear')).toBe('2026');
            expect(query.get('periodValue')).toBe('October');
            expect(query.get('year')).toBe('2026');
        });

        it(`${endpoint.name}: preserves single-period requests`, async () => {
            mockReport('quarter');
            await endpoint.request('quarter');
            const query = new URL(fetchMock.mock.calls[0][0]).searchParams;
            expect(query.get('periodValue')).toBe('Q4: Oct-Dec');
            expect(query.get('year')).toBe('2026');
        });
    }
});