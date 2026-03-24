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

class StatisticsApiService {
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
        year: number
    ): Promise<StaffPerformanceData> {
        try {
            const mappedType = this.mapRegistryType(registryType);
            const params = new URLSearchParams({
                registryType: mappedType,
                unitId: unitId.toString(),
                periodType,
                periodValue,
                year: year.toString()
            });

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

    async getUnitPerformance(
        registryType: string,
        periodType: string,
        periodValue: string,
        year: number
    ): Promise<UnitPerformanceData> {
        try {
            const mappedType = this.mapRegistryType(registryType);
            const params = new URLSearchParams({
                registryType: mappedType,
                periodType,
                periodValue,
                year: year.toString()
            });

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