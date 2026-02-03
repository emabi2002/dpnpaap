import { getSupabaseClient } from './client';
import type {
  ProcurementPlan,
  ProcurementPlanItem,
  ProcurementPlanStatus,
  FundSource,
  ProcurementMethod,
  ContractType,
  UnitOfMeasure,
  Province,
  District,
  UNSPSCCode,
} from '../types';

// Get the Supabase client
const getClient = () => getSupabaseClient();

// Helper type for database records
type DbRecord = Record<string, unknown>;

// =============================================
// LOOKUP TABLE OPERATIONS
// =============================================

export async function getFundSources(): Promise<FundSource[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('fund_sources')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching fund sources:', error);
    return [];
  }

  return (data as DbRecord[]).map(fs => ({
    id: fs.id as string,
    code: fs.code as string,
    name: fs.name as string,
    description: fs.description as string | undefined,
    donorCodeId: fs.donor_code_id as string | undefined,
    active: fs.active as boolean,
  }));
}

export async function getProcurementMethods(): Promise<ProcurementMethod[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('procurement_methods')
    .select('*')
    .eq('active', true)
    .order('code');

  if (error) {
    console.error('Error fetching procurement methods:', error);
    return [];
  }

  return (data as DbRecord[]).map(pm => ({
    id: pm.id as string,
    code: pm.code as string,
    name: pm.name as string,
    description: pm.description as string | undefined,
    thresholdMin: pm.threshold_min as number | undefined,
    thresholdMax: pm.threshold_max as number | undefined,
    requiresApproval: pm.requires_approval as boolean,
    active: pm.active as boolean,
  }));
}

export async function getContractTypes(): Promise<ContractType[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('contract_types')
    .select('*')
    .eq('active', true)
    .order('code');

  if (error) {
    console.error('Error fetching contract types:', error);
    return [];
  }

  return (data as DbRecord[]).map(ct => ({
    id: ct.id as string,
    code: ct.code as string,
    name: ct.name as string,
    description: ct.description as string | undefined,
    category: ct.category as 'goods' | 'services' | 'works' | 'consulting',
    active: ct.active as boolean,
  }));
}

export async function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('units_of_measure')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching units of measure:', error);
    return [];
  }

  return (data as DbRecord[]).map(uom => ({
    id: uom.id as string,
    code: uom.code as string,
    name: uom.name as string,
    abbreviation: uom.abbreviation as string,
    active: uom.active as boolean,
  }));
}

export async function getProvinces(): Promise<Province[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }

  return (data as DbRecord[]).map(p => ({
    id: p.id as string,
    code: p.code as string,
    name: p.name as string,
    region: p.region as 'Southern' | 'Highlands' | 'Momase' | 'Islands',
    active: p.active as boolean,
  }));
}

export async function getDistrictsByProvince(provinceId: string): Promise<District[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('province_id', provinceId)
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching districts:', error);
    return [];
  }

  return (data as DbRecord[]).map(d => ({
    id: d.id as string,
    provinceId: d.province_id as string,
    code: d.code as string,
    name: d.name as string,
    active: d.active as boolean,
  }));
}

export async function searchUNSPSCCodes(query: string): Promise<UNSPSCCode[]> {
  const supabase = getClient();

  // Search by code or text
  const { data, error } = await supabase
    .from('unspsc_codes')
    .select('*')
    .or(`code.ilike.%${query}%,title.ilike.%${query}%,commodity_title.ilike.%${query}%`)
    .eq('active', true)
    .limit(10);

  if (error) {
    console.error('Error searching UNSPSC codes:', error);
    return [];
  }

  return (data as DbRecord[]).map(u => ({
    id: u.id as string,
    code: u.code as string,
    title: u.title as string,
    segment: u.segment as string,
    segmentTitle: u.segment_title as string,
    family: u.family as string,
    familyTitle: u.family_title as string,
    classCode: u.class_code as string,
    classTitle: u.class_title as string,
    commodityTitle: u.commodity_title as string,
    active: u.active as boolean,
  }));
}

// =============================================
// PROCUREMENT PLAN OPERATIONS
// =============================================

export async function getProcurementPlans(
  financialYearId?: string,
  agencyId?: string
): Promise<ProcurementPlan[]> {
  const supabase = getClient();
  let query = supabase
    .from('procurement_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (financialYearId) {
    query = query.eq('financial_year_id', financialYearId);
  }

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching procurement plans:', error);
    return [];
  }

  return (data as DbRecord[]).map(mapPlanFromDb);
}

export async function getProcurementPlanById(id: string): Promise<ProcurementPlan | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('procurement_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching procurement plan:', error);
    return null;
  }

  return mapPlanFromDb(data as DbRecord);
}

export async function createProcurementPlan(
  plan: Omit<ProcurementPlan, 'id' | 'createdAt' | 'updatedAt' | 'totalEstimatedValue' | 'itemCount'>
): Promise<ProcurementPlan | null> {
  const supabase = getClient();

  const insertData = {
    financial_year_id: plan.financialYearId,
    agency_id: plan.agencyId,
    plan_name: plan.planName,
    agency_procurement_entity_name: plan.agencyProcurementEntityName,
    agency_budget_code: plan.agencyBudgetCode,
    period_start: plan.periodStart,
    period_end: plan.periodEnd,
    fund_source_id: plan.fundSourceId,
    status: plan.status || 'draft',
    created_by: plan.createdBy,
  };

  const { data, error } = await supabase
    .from('procurement_plans')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating procurement plan:', error);
    return null;
  }

  const record = data as DbRecord;

  // Create initial workflow action
  await supabase.from('procurement_workflow_actions').insert({
    procurement_plan_id: record.id,
    action_type: 'create',
    to_status: 'draft',
    action_by: plan.createdBy,
    comments: 'Plan created',
  } as never);

  return mapPlanFromDb(record);
}

export async function updateProcurementPlan(
  id: string,
  updates: Partial<ProcurementPlan>
): Promise<ProcurementPlan | null> {
  const supabase = getClient();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.planName !== undefined) dbUpdates.plan_name = updates.planName;
  if (updates.agencyProcurementEntityName !== undefined) dbUpdates.agency_procurement_entity_name = updates.agencyProcurementEntityName;
  if (updates.agencyBudgetCode !== undefined) dbUpdates.agency_budget_code = updates.agencyBudgetCode;
  if (updates.periodStart !== undefined) dbUpdates.period_start = updates.periodStart;
  if (updates.periodEnd !== undefined) dbUpdates.period_end = updates.periodEnd;
  if (updates.fundSourceId !== undefined) dbUpdates.fund_source_id = updates.fundSourceId;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.submittedBy !== undefined) dbUpdates.submitted_by = updates.submittedBy;
  if (updates.submittedAt !== undefined) dbUpdates.submitted_at = updates.submittedAt;
  if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;

  const { data, error } = await supabase
    .from('procurement_plans')
    .update(dbUpdates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating procurement plan:', error);
    return null;
  }

  return mapPlanFromDb(data as DbRecord);
}

export async function updatePlanStatus(
  planId: string,
  newStatus: ProcurementPlanStatus,
  userId: string,
  comments?: string
): Promise<boolean> {
  const supabase = getClient();

  // Get current plan
  const { data: plan, error: fetchError } = await supabase
    .from('procurement_plans')
    .select('status')
    .eq('id', planId)
    .single();

  if (fetchError) {
    console.error('Error fetching plan for status update:', fetchError);
    return false;
  }

  const record = plan as DbRecord;
  const fromStatus = record.status as ProcurementPlanStatus;

  // Determine action type
  let actionType = 'update';
  if (newStatus === 'submitted') actionType = 'submit';
  else if (newStatus === 'approved_by_agency' || newStatus === 'approved_by_dnpm') actionType = 'approve';
  else if (newStatus === 'returned' || newStatus === 'draft') actionType = 'return';
  else if (newStatus === 'locked') actionType = 'lock';
  else if (newStatus === 'under_dnpm_review') actionType = 'review';

  // Update status
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'submitted') {
    updates.submitted_by = userId;
    updates.submitted_at = new Date().toISOString();
  } else if (newStatus === 'approved_by_dnpm' || newStatus === 'approved_by_agency') {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('procurement_plans')
    .update(updates as never)
    .eq('id', planId);

  if (updateError) {
    console.error('Error updating plan status:', updateError);
    return false;
  }

  // Create workflow action
  await supabase.from('procurement_workflow_actions').insert({
    procurement_plan_id: planId,
    action_type: actionType,
    from_status: fromStatus,
    to_status: newStatus,
    action_by: userId,
    comments,
  } as never);

  return true;
}

// =============================================
// PROCUREMENT PLAN ITEM OPERATIONS
// =============================================

export async function getProcurementPlanItems(planId: string): Promise<ProcurementPlanItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('procurement_plan_items')
    .select('*')
    .eq('procurement_plan_id', planId)
    .order('sequence_no');

  if (error) {
    console.error('Error fetching procurement items:', error);
    return [];
  }

  return (data as DbRecord[]).map(mapItemFromDb);
}

export async function createProcurementPlanItem(
  item: Omit<ProcurementPlanItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProcurementPlanItem | null> {
  const supabase = getClient();

  const insertData = {
    procurement_plan_id: item.procurementPlanId,
    sequence_no: item.sequenceNo,
    activity_or_procurement_title: item.activityOrProcurementTitle,
    description_of_item: item.descriptionOfItem,
    unspsc_id: item.unspscId,
    unspsc_code: item.unspscCode,
    unspsc_description: item.unspscDescription,
    estimated_contract_start: item.estimatedContractStart,
    estimated_contract_end: item.estimatedContractEnd,
    anticipated_duration_months: item.anticipatedDurationMonths,
    quantity: item.quantity,
    unit_of_measure_id: item.unitOfMeasureId,
    estimated_unit_cost: item.estimatedUnitCost,
    estimated_total_cost: item.estimatedTotalCost,
    cost_override_justification: item.costOverrideJustification,
    multi_year_flag: item.multiYearFlag,
    multi_year_total_budget: item.multiYearTotalBudget,
    annual_budget_year_value: item.annualBudgetYearValue,
    q1_budget: item.q1Budget,
    q2_budget: item.q2Budget,
    q3_budget: item.q3Budget,
    q4_budget: item.q4Budget,
    location_scope: item.locationScope,
    location_notes: item.locationNotes,
    province_id: item.provinceId,
    district_id: item.districtId,
    procurement_method_id: item.procurementMethodId,
    contract_type_id: item.contractTypeId,
    third_party_contract_mgmt_required: item.thirdPartyContractMgmtRequired,
    comments: item.comments,
    risk_notes: item.riskNotes,
    created_by: item.createdBy,
  };

  const { data, error } = await supabase
    .from('procurement_plan_items')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating procurement item:', error);
    return null;
  }

  return mapItemFromDb(data as DbRecord);
}

export async function updateProcurementPlanItem(
  id: string,
  updates: Partial<ProcurementPlanItem>
): Promise<ProcurementPlanItem | null> {
  const supabase = getClient();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.sequenceNo !== undefined) dbUpdates.sequence_no = updates.sequenceNo;
  if (updates.activityOrProcurementTitle !== undefined) dbUpdates.activity_or_procurement_title = updates.activityOrProcurementTitle;
  if (updates.descriptionOfItem !== undefined) dbUpdates.description_of_item = updates.descriptionOfItem;
  if (updates.unspscId !== undefined) dbUpdates.unspsc_id = updates.unspscId;
  if (updates.unspscCode !== undefined) dbUpdates.unspsc_code = updates.unspscCode;
  if (updates.unspscDescription !== undefined) dbUpdates.unspsc_description = updates.unspscDescription;
  if (updates.estimatedContractStart !== undefined) dbUpdates.estimated_contract_start = updates.estimatedContractStart;
  if (updates.estimatedContractEnd !== undefined) dbUpdates.estimated_contract_end = updates.estimatedContractEnd;
  if (updates.anticipatedDurationMonths !== undefined) dbUpdates.anticipated_duration_months = updates.anticipatedDurationMonths;
  if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
  if (updates.unitOfMeasureId !== undefined) dbUpdates.unit_of_measure_id = updates.unitOfMeasureId;
  if (updates.estimatedUnitCost !== undefined) dbUpdates.estimated_unit_cost = updates.estimatedUnitCost;
  if (updates.estimatedTotalCost !== undefined) dbUpdates.estimated_total_cost = updates.estimatedTotalCost;
  if (updates.costOverrideJustification !== undefined) dbUpdates.cost_override_justification = updates.costOverrideJustification;
  if (updates.multiYearFlag !== undefined) dbUpdates.multi_year_flag = updates.multiYearFlag;
  if (updates.multiYearTotalBudget !== undefined) dbUpdates.multi_year_total_budget = updates.multiYearTotalBudget;
  if (updates.annualBudgetYearValue !== undefined) dbUpdates.annual_budget_year_value = updates.annualBudgetYearValue;
  if (updates.q1Budget !== undefined) dbUpdates.q1_budget = updates.q1Budget;
  if (updates.q2Budget !== undefined) dbUpdates.q2_budget = updates.q2Budget;
  if (updates.q3Budget !== undefined) dbUpdates.q3_budget = updates.q3Budget;
  if (updates.q4Budget !== undefined) dbUpdates.q4_budget = updates.q4Budget;
  if (updates.locationScope !== undefined) dbUpdates.location_scope = updates.locationScope;
  if (updates.locationNotes !== undefined) dbUpdates.location_notes = updates.locationNotes;
  if (updates.provinceId !== undefined) dbUpdates.province_id = updates.provinceId;
  if (updates.districtId !== undefined) dbUpdates.district_id = updates.districtId;
  if (updates.procurementMethodId !== undefined) dbUpdates.procurement_method_id = updates.procurementMethodId;
  if (updates.contractTypeId !== undefined) dbUpdates.contract_type_id = updates.contractTypeId;
  if (updates.thirdPartyContractMgmtRequired !== undefined) dbUpdates.third_party_contract_mgmt_required = updates.thirdPartyContractMgmtRequired;
  if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
  if (updates.riskNotes !== undefined) dbUpdates.risk_notes = updates.riskNotes;

  const { data, error } = await supabase
    .from('procurement_plan_items')
    .update(dbUpdates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating procurement item:', error);
    return null;
  }

  return mapItemFromDb(data as DbRecord);
}

export async function deleteProcurementPlanItem(id: string): Promise<boolean> {
  const supabase = getClient();
  const { error } = await supabase
    .from('procurement_plan_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting procurement item:', error);
    return false;
  }

  return true;
}

export async function bulkCreateProcurementPlanItems(
  items: Omit<ProcurementPlanItem, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<ProcurementPlanItem[]> {
  const supabase = getClient();

  const dbItems = items.map(item => ({
    procurement_plan_id: item.procurementPlanId,
    sequence_no: item.sequenceNo,
    activity_or_procurement_title: item.activityOrProcurementTitle,
    description_of_item: item.descriptionOfItem,
    unspsc_id: item.unspscId,
    unspsc_code: item.unspscCode,
    unspsc_description: item.unspscDescription,
    estimated_contract_start: item.estimatedContractStart,
    estimated_contract_end: item.estimatedContractEnd,
    anticipated_duration_months: item.anticipatedDurationMonths,
    quantity: item.quantity,
    unit_of_measure_id: item.unitOfMeasureId,
    estimated_unit_cost: item.estimatedUnitCost,
    estimated_total_cost: item.estimatedTotalCost,
    multi_year_flag: item.multiYearFlag,
    multi_year_total_budget: item.multiYearTotalBudget,
    annual_budget_year_value: item.annualBudgetYearValue,
    q1_budget: item.q1Budget,
    q2_budget: item.q2Budget,
    q3_budget: item.q3Budget,
    q4_budget: item.q4Budget,
    location_scope: item.locationScope,
    location_notes: item.locationNotes,
    province_id: item.provinceId,
    district_id: item.districtId,
    procurement_method_id: item.procurementMethodId,
    contract_type_id: item.contractTypeId,
    third_party_contract_mgmt_required: item.thirdPartyContractMgmtRequired,
    comments: item.comments,
    risk_notes: item.riskNotes,
    created_by: item.createdBy,
  }));

  const { data, error } = await supabase
    .from('procurement_plan_items')
    .insert(dbItems as never[])
    .select();

  if (error) {
    console.error('Error bulk creating procurement items:', error);
    return [];
  }

  return (data as DbRecord[]).map(mapItemFromDb);
}

// =============================================
// WORKFLOW ACTIONS
// =============================================

export interface WorkflowAction {
  id: string;
  procurementPlanId: string;
  actionType: string;
  fromStatus: ProcurementPlanStatus | null;
  toStatus: ProcurementPlanStatus;
  actionBy: string;
  actionDate: Date;
  comments?: string;
}

export async function getWorkflowActions(planId: string): Promise<WorkflowAction[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('procurement_workflow_actions')
    .select('*')
    .eq('procurement_plan_id', planId)
    .order('action_date', { ascending: false });

  if (error) {
    console.error('Error fetching workflow actions:', error);
    return [];
  }

  return (data as DbRecord[]).map(wa => ({
    id: wa.id as string,
    procurementPlanId: wa.procurement_plan_id as string,
    actionType: wa.action_type as string,
    fromStatus: wa.from_status as ProcurementPlanStatus | null,
    toStatus: wa.to_status as ProcurementPlanStatus,
    actionBy: wa.action_by as string,
    actionDate: new Date(wa.action_date as string),
    comments: wa.comments as string | undefined,
  }));
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function mapPlanFromDb(data: DbRecord): ProcurementPlan {
  return {
    id: data.id as string,
    financialYearId: data.financial_year_id as string,
    agencyId: data.agency_id as string,
    planName: data.plan_name as string,
    agencyProcurementEntityName: data.agency_procurement_entity_name as string | undefined,
    agencyBudgetCode: data.agency_budget_code as string | undefined,
    periodStart: new Date(data.period_start as string),
    periodEnd: new Date(data.period_end as string),
    fundSourceId: data.fund_source_id as string,
    status: data.status as ProcurementPlanStatus,
    totalEstimatedValue: Number(data.total_estimated_value) || 0,
    itemCount: Number(data.item_count) || 0,
    submittedBy: data.submitted_by as string | undefined,
    submittedAt: data.submitted_at ? new Date(data.submitted_at as string) : undefined,
    approvedBy: data.approved_by as string | undefined,
    approvedAt: data.approved_at ? new Date(data.approved_at as string) : undefined,
    createdBy: data.created_by as string,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

function mapItemFromDb(data: DbRecord): ProcurementPlanItem {
  return {
    id: data.id as string,
    procurementPlanId: data.procurement_plan_id as string,
    sequenceNo: Number(data.sequence_no),
    activityOrProcurementTitle: data.activity_or_procurement_title as string,
    descriptionOfItem: data.description_of_item as string,
    unspscId: data.unspsc_id as string | undefined,
    unspscCode: data.unspsc_code as string | undefined,
    unspscDescription: data.unspsc_description as string | undefined,
    estimatedContractStart: new Date(data.estimated_contract_start as string),
    estimatedContractEnd: new Date(data.estimated_contract_end as string),
    anticipatedDurationMonths: Number(data.anticipated_duration_months),
    quantity: Number(data.quantity),
    unitOfMeasureId: data.unit_of_measure_id as string | undefined,
    estimatedUnitCost: Number(data.estimated_unit_cost),
    estimatedTotalCost: Number(data.estimated_total_cost),
    costOverrideJustification: data.cost_override_justification as string | undefined,
    multiYearFlag: Boolean(data.multi_year_flag),
    multiYearTotalBudget: data.multi_year_total_budget ? Number(data.multi_year_total_budget) : undefined,
    annualBudgetYearValue: Number(data.annual_budget_year_value),
    q1Budget: Number(data.q1_budget),
    q2Budget: Number(data.q2_budget),
    q3Budget: Number(data.q3_budget),
    q4Budget: Number(data.q4_budget),
    locationScope: data.location_scope as 'national' | 'provincial' | 'district' | 'specific_sites',
    locationNotes: data.location_notes as string | undefined,
    provinceId: data.province_id as string | undefined,
    districtId: data.district_id as string | undefined,
    procurementMethodId: data.procurement_method_id as string,
    contractTypeId: data.contract_type_id as string,
    thirdPartyContractMgmtRequired: Boolean(data.third_party_contract_mgmt_required),
    comments: data.comments as string | undefined,
    riskNotes: data.risk_notes as string | undefined,
    createdBy: data.created_by as string,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}
