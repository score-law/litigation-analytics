import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { ApiResponse, SpecificationData, ApiMotionData } from '@/types';

/**
 * API route to fetch specification and motion data
 * 
 * Accepts query parameters:
 * - courtId: Court identifier (0 = all courts)
 * - judgeId: Judge identifier (0 = all judges)
 * - chargeId: Comma-separated list of charge IDs (uses first one, 0 = all charges)
 * - prosecutionId: Prosecution identifier (0 = all prosecutions)
 * - chargeSeverity: Charge severity level (0 = all severities)
 * - trialCategory: Trial type (0 = all trial types)
 */

export async function GET(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const courtId = parseInt(searchParams.get('courtId') || '0', 10);
      const judgeId = parseInt(searchParams.get('judgeId') || '0', 10);
      let chargeId = 0;
      const chargeIds = searchParams.get('chargeId');
      if (chargeIds) {
        const firstCharge = chargeIds.split(',')[0];
        if (firstCharge) {
          chargeId = parseInt(firstCharge, 10);
        }
      }
      const prosecutionId = parseInt(searchParams.get('prosecutionId') || '0', 10);
      const chargeSeverity = parseInt(searchParams.get('chargeSeverity') || '0', 10);
      const trialCategory = searchParams.get('trialCategory') || 'any';

      console.log('courtId:', courtId);
        console.log('judgeId:', judgeId);
        console.log('chargeId:', chargeId);
        console.log('prosecutionId:', prosecutionId);
        console.log('chargeSeverity:', chargeSeverity);
        console.log('trialCategory:', trialCategory);

  
      const specificationQuery = `
        SELECT * FROM specification
        WHERE
          (court_id = ? OR ? = 0) AND
          (judge_id = ? OR ? = 0) AND
          (charge_id = ? OR ? = 0) AND
          (prosecution_id = ? OR ? = 0) AND
          (charge_severity = ? OR ? = 0) AND
          (trial_category = ? OR ? = 'any')
      `;
      const specParams = [
        courtId, courtId,
        judgeId, judgeId,
        chargeId, chargeId,
        prosecutionId, prosecutionId,
        chargeSeverity, chargeSeverity,
        trialCategory, trialCategory
      ];
  
      const specificationData = await query<SpecificationData[]>(specificationQuery, specParams);
  
      if (!specificationData || specificationData.length === 0) {
        return NextResponse.json({ specification: [], motion_data: [] });
      }
  
      const specIds = specificationData.map(spec => spec.specification_id);
      let motionData: ApiMotionData[] = [];
  
      if (specIds.length > 0) {
        const placeholders = specIds.map(() => '?').join(',');
        const motionQuery = `SELECT * FROM motion_data WHERE specification_id IN (${placeholders})`;
        motionData = await query<ApiMotionData[]>(motionQuery, specIds);
      }
  
      const apiResponse: ApiResponse = {
        specification: specificationData,
        motion_data: motionData
      };
  
      return NextResponse.json(apiResponse);
    } catch (error) {
      console.error('Error processing specification request:', error);
      return NextResponse.json(
        { error: 'Failed to fetch specification data' },
        { status: 500 }
      );
    }
  }