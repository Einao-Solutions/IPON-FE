import { baseURL } from '$lib/helpers';
import { loggedInToken } from '$lib/store';
import { get } from 'svelte/store';

export interface UnitInfo {
    unitId: number;
    unitName: string;
    registryType: string;
}

export interface StaffInfo {
    staffId: string;
    staffName: string;
    staffEmail: string;
    unitId: number;
    unitName: string;
}

export interface StaffPerformanceEntry {
    staffId: string;
    staffName: string;
    staffEmail: string;
    totalAssigned: number;
    totalTreated: number;
    percentage: number;
    contributionToUnit: number;
}

export interface StaffPerformanceSummary {
    totalAssigned: number;
    totalTreated: number;
    treatmentRate: number;
}

export interface Period {
    type: string;
    value: string;
    year: number;
}

export interface StaffPerformanceData {
    unitId: number;
    unitName: string;
    registryType: string;
    period: Period;
    summary: StaffPerformanceSummary;
    staffPerformance: StaffPerformanceEntry[];
}

export interface UnitPerformanceEntry {
    unitId: number;
    unitName: string;
    totalAssigned: number;
    totalTreated: number;
    treatmentRate: number;
    staffCount: number;
    avgPerStaff: number;
}

export interface UnitPerformanceOverview {
    totalUnits: number;
    totalAssigned: number;
    totalTreated: number;
    overallRate: number;
}

export interface UnitPerformanceData {
    registryType: string;
    period: Period;
    overview: UnitPerformanceOverview;
    units: UnitPerformanceEntry[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PerformanceRange {
    startYear?: number;
    endYear?: number;
    startDate?: string;
    endDate?: string;
}

export interface PerformancePeriodRequest extends PerformanceRange {
    periodType: string;
    periodValue: string;
    year: number;
}

export interface UnitPerformanceComparisonData {
    registryType: string;
    periods: UnitPerformanceData[];
}

class StatisticsApiService {
    private buildPeriodParams(periodType: string, periodValue: string, year: number, range?: PerformanceRange) {
        const params = new URLSearchParams({ periodType, periodValue, year: year.toString() });
        if (periodType === 'year-range') {
            if (!range || !Number.isInteger(range.startYear) || !Number.isInteger(range.endYear) || range.startYear! > range.endYear!) {
                throw new Error('Please select a valid year range');
            }
            params.set('startYear', range.startYear!.toString());
            params.set('endYear', range.endYear!.toString());
        } else if (periodType === 'date-range') {
            const isValidDate = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
            if (!isValidDate(range?.startDate) || !isValidDate(range?.endDate) || range!.startDate! > range!.endDate!) {
                throw new Error('Please select a valid date range');
            }
            params.set('startDate', range!.startDate!);
            params.set('endDate', range!.endDate!);
        }
        return params;
    }

    private getAuthHeaders() {
        const token = get(loggedInToken);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    private mapRegistryType(registryType: string): string {
        // Map "Trademark" to "TradeMark" for backend
        if (registryType === "Trademark") {
            return "TradeMark";
        }
        return registryType;
    }

    async getUnits(registryType: string): Promise<UnitInfo[]> {
        try {
            const mappedType = this.mapRegistryType(registryType);
            const response = await fetch(
                `${baseURL}/api/units?registryType=${encodeURIComponent(mappedType)}`,
                {
                    headers: this.getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch units: ${response.statusText}`);
            }

            const result: ApiResponse<UnitInfo[]> = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch units');
            }

            return result.data || [];
        } catch (error) {
            console.error('Error fetching units:', error);
            throw error;
        }
    }

    async getStaffPerformance(
        registryType: string,
        unitId: number,
        periodType: string,
        periodValue: string,
        year: number,
        range?: PerformanceRange
    ): Promise<StaffPerformanceData> {
        try {
            const mappedType = this.mapRegistryType(registryType);
            const params = this.buildPeriodParams(periodType, periodValue, year, range);
            params.set('registryType', mappedType);
            params.set('unitId', unitId.toString());

            const response = await fetch(
                `${baseURL}/api/statistics/performance/staff?${params.toString()}`,
                {
                    headers: this.getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch staff performance: ${response.statusText}`);
            }

            const result: ApiResponse<StaffPerformanceData> = await response.json();
            
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch staff performance');
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching staff performance:', error);
            throw error;
        }
    }

    async compareUnitPerformance(registryType: string, periods: PerformancePeriodRequest[]): Promise<UnitPerformanceComparisonData> {
        if (periods.length < 2 || periods.length > 5) {
            throw new Error('Please select between 2 and 5 periods to compare');
        }
        const response = await fetch(`${baseURL}/api/statistics/performance/units/compare`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                registryType: this.mapRegistryType(registryType),
                periods: periods.map(period => ({ type: period.periodType, ...period }))
            })
        });
        const result: ApiResponse<UnitPerformanceComparisonData> = await response.json();
        if (!response.ok || !result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch unit performance comparison');
        }
        return result.data;
    }

    async getUnitPerformance(
        registryType: string,
        periodType: string,
        periodValue: string,
        year: number,
        range?: PerformanceRange
    ): Promise<UnitPerformanceData> {
        try {
            const mappedType = this.mapRegistryType(registryType);
            const params = this.buildPeriodParams(periodType, periodValue, year, range);
            params.set('registryType', mappedType);

            const response = await fetch(
                `${baseURL}/api/statistics/performance/units?${params.toString()}`,
                {
                    headers: this.getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch unit performance: ${response.statusText}`);
            }

            const result: ApiResponse<UnitPerformanceData> = await response.json();
            
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch unit performance');
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching unit performance:', error);
            throw error;
        }
    }
}

export const statisticsApi = new StatisticsApiService();