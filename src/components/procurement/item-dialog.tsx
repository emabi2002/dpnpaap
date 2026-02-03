'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Save,
  Loader2,
  Package,
  Calendar,
  DollarSign,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import {
  getActiveProcurementMethods,
  getActiveContractTypes,
  getActiveUnitsOfMeasure,
  provinces,
  getDistrictsByProvinceId,
  searchUNSPSCCodes,
} from '@/lib/database';
import {
  LOCATION_SCOPE_LABELS,
  distributeToQuarters,
  validateQuarterTotals,
  calculateDurationMonths,
  type ProcurementPlanItem,
  type LocationScope,
  type UNSPSCCode,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProcurementPlanItem | null;
  planId: string;
  onSave: (item: Partial<ProcurementPlanItem>) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  existingSequences: number[];
}

export function ProcurementItemDialog({
  open,
  onOpenChange,
  item,
  planId,
  onSave,
  onDelete,
  existingSequences,
}: ItemDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [unspscSearchQuery, setUnspscSearchQuery] = useState('');
  const [unspscSearchResults, setUnspscSearchResults] = useState<UNSPSCCode[]>([]);
  const [showUnspscSearch, setShowUnspscSearch] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ProcurementPlanItem>>({
    procurementPlanId: planId,
    sequenceNo: 1,
    activityOrProcurementTitle: '',
    descriptionOfItem: '',
    estimatedContractStart: new Date(),
    estimatedContractEnd: new Date(),
    anticipatedDurationMonths: 12,
    quantity: 1,
    estimatedUnitCost: 0,
    estimatedTotalCost: 0,
    multiYearFlag: false,
    annualBudgetYearValue: 0,
    q1Budget: 0,
    q2Budget: 0,
    q3Budget: 0,
    q4Budget: 0,
    locationScope: 'national',
    procurementMethodId: '',
    contractTypeId: '',
    thirdPartyContractMgmtRequired: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const procurementMethods = getActiveProcurementMethods();
  const contractTypes = getActiveContractTypes();
  const unitsOfMeasure = getActiveUnitsOfMeasure();
  const activeProvinces = provinces.filter(p => p.active);

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        estimatedContractStart: new Date(item.estimatedContractStart),
        estimatedContractEnd: new Date(item.estimatedContractEnd),
      });
    } else {
      const nextSequence = existingSequences.length > 0
        ? Math.max(...existingSequences) + 1
        : 1;
      setFormData({
        procurementPlanId: planId,
        sequenceNo: nextSequence,
        activityOrProcurementTitle: '',
        descriptionOfItem: '',
        estimatedContractStart: new Date(),
        estimatedContractEnd: new Date(),
        anticipatedDurationMonths: 12,
        quantity: 1,
        estimatedUnitCost: 0,
        estimatedTotalCost: 0,
        multiYearFlag: false,
        annualBudgetYearValue: 0,
        q1Budget: 0,
        q2Budget: 0,
        q3Budget: 0,
        q4Budget: 0,
        locationScope: 'national',
        procurementMethodId: '',
        contractTypeId: '',
        thirdPartyContractMgmtRequired: false,
      });
    }
    setActiveTab('details');
    setErrors({});
  }, [item, planId, existingSequences]);

  // UNSPSC search
  useEffect(() => {
    if (unspscSearchQuery.length >= 2) {
      const results = searchUNSPSCCodes(unspscSearchQuery);
      setUnspscSearchResults(results);
      setShowUnspscSearch(true);
    } else {
      setUnspscSearchResults([]);
      setShowUnspscSearch(false);
    }
  }, [unspscSearchQuery]);

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate total cost
    if (field === 'quantity' || field === 'estimatedUnitCost') {
      const qty = field === 'quantity' ? (value as number) : (formData.quantity || 1);
      const unitCost = field === 'estimatedUnitCost' ? (value as number) : (formData.estimatedUnitCost || 0);
      const total = qty * unitCost;
      setFormData(prev => ({
        ...prev,
        [field]: value,
        estimatedTotalCost: total,
        annualBudgetYearValue: total,
      }));
    }

    // Auto-calculate duration
    if (field === 'estimatedContractStart' || field === 'estimatedContractEnd') {
      const start = field === 'estimatedContractStart' ? new Date(value as string) : formData.estimatedContractStart;
      const end = field === 'estimatedContractEnd' ? new Date(value as string) : formData.estimatedContractEnd;
      if (start && end) {
        const duration = calculateDurationMonths(start as Date, end as Date);
        setFormData(prev => ({
          ...prev,
          [field]: new Date(value as string),
          anticipatedDurationMonths: duration,
        }));
      }
    }
  };

  const selectUNSPSC = (unspsc: UNSPSCCode) => {
    setFormData(prev => ({
      ...prev,
      unspscId: unspsc.id,
      unspscCode: unspsc.code,
      unspscDescription: unspsc.title,
    }));
    setUnspscSearchQuery('');
    setShowUnspscSearch(false);
  };

  const clearUNSPSC = () => {
    setFormData(prev => ({
      ...prev,
      unspscId: undefined,
      unspscCode: undefined,
      unspscDescription: undefined,
    }));
  };

  const distributeQuarters = () => {
    const annual = formData.annualBudgetYearValue || 0;
    const quarters = distributeToQuarters(annual);
    setFormData(prev => ({
      ...prev,
      q1Budget: quarters.q1,
      q2Budget: quarters.q2,
      q3Budget: quarters.q3,
      q4Budget: quarters.q4,
    }));
    toast.success('Budget distributed equally across quarters');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.activityOrProcurementTitle) {
      newErrors.activityOrProcurementTitle = 'Title is required';
    }
    if (!formData.descriptionOfItem) {
      newErrors.descriptionOfItem = 'Description is required';
    }
    if (!formData.procurementMethodId) {
      newErrors.procurementMethodId = 'Procurement method is required';
    }
    if (!formData.contractTypeId) {
      newErrors.contractTypeId = 'Contract type is required';
    }
    if ((formData.annualBudgetYearValue || 0) <= 0) {
      newErrors.annualBudgetYearValue = 'Annual budget must be greater than 0';
    }

    // Validate quarter totals
    const quarterSum = (formData.q1Budget || 0) + (formData.q2Budget || 0) +
      (formData.q3Budget || 0) + (formData.q4Budget || 0);
    const annual = formData.annualBudgetYearValue || 0;
    if (Math.abs(quarterSum - annual) > 1) {
      newErrors.q1Budget = `Quarter totals (K${quarterSum.toLocaleString()}) must equal annual value (K${annual.toLocaleString()})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => `K ${amount.toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" />
            {item ? 'Edit Procurement Item' : 'Add Procurement Item'}
          </DialogTitle>
          <DialogDescription>
            {item ? 'Update the procurement item details' : 'Add a new item to the procurement plan'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sequenceNo">Sequence #</Label>
                <Input
                  id="sequenceNo"
                  type="number"
                  value={formData.sequenceNo || ''}
                  onChange={(e) => handleChange('sequenceNo', parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Multi-Year Contract</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.multiYearFlag}
                    onCheckedChange={(checked) => handleChange('multiYearFlag', checked)}
                  />
                  <span className="text-sm text-slate-500">
                    {formData.multiYearFlag ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityOrProcurementTitle">Title *</Label>
              <Input
                id="activityOrProcurementTitle"
                value={formData.activityOrProcurementTitle || ''}
                onChange={(e) => handleChange('activityOrProcurementTitle', e.target.value)}
                placeholder="e.g., IT Equipment for Regional Offices"
                className={errors.activityOrProcurementTitle ? 'border-red-500' : ''}
              />
              {errors.activityOrProcurementTitle && (
                <p className="text-xs text-red-500">{errors.activityOrProcurementTitle}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionOfItem">Description *</Label>
              <Textarea
                id="descriptionOfItem"
                value={formData.descriptionOfItem || ''}
                onChange={(e) => handleChange('descriptionOfItem', e.target.value)}
                placeholder="Detailed description of the procurement item..."
                rows={3}
                className={errors.descriptionOfItem ? 'border-red-500' : ''}
              />
              {errors.descriptionOfItem && (
                <p className="text-xs text-red-500">{errors.descriptionOfItem}</p>
              )}
            </div>

            {/* UNSPSC Code */}
            <div className="space-y-2">
              <Label>UNSPSC Code</Label>
              {formData.unspscCode ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {formData.unspscCode}
                  </Badge>
                  <span className="text-sm text-slate-600">{formData.unspscDescription}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearUNSPSC}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search UNSPSC codes..."
                    value={unspscSearchQuery}
                    onChange={(e) => setUnspscSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {showUnspscSearch && unspscSearchResults.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                      <CardContent className="p-0">
                        {unspscSearchResults.map((unspsc) => (
                          <button
                            key={unspsc.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm border-b last:border-0"
                            onClick={() => selectUNSPSC(unspsc)}
                          >
                            <span className="font-mono text-teal-600">{unspsc.code}</span>
                            <span className="ml-2 text-slate-600">{unspsc.title}</span>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procurementMethodId">Procurement Method *</Label>
                <Select
                  value={formData.procurementMethodId}
                  onValueChange={(value) => handleChange('procurementMethodId', value)}
                >
                  <SelectTrigger className={errors.procurementMethodId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {procurementMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.code} - {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.procurementMethodId && (
                  <p className="text-xs text-red-500">{errors.procurementMethodId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractTypeId">Contract Type *</Label>
                <Select
                  value={formData.contractTypeId}
                  onValueChange={(value) => handleChange('contractTypeId', value)}
                >
                  <SelectTrigger className={errors.contractTypeId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.code} - {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contractTypeId && (
                  <p className="text-xs text-red-500">{errors.contractTypeId}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timing" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedContractStart">Contract Start Date</Label>
                <Input
                  id="estimatedContractStart"
                  type="date"
                  value={formData.estimatedContractStart instanceof Date
                    ? formData.estimatedContractStart.toISOString().split('T')[0]
                    : ''}
                  onChange={(e) => handleChange('estimatedContractStart', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedContractEnd">Contract End Date</Label>
                <Input
                  id="estimatedContractEnd"
                  type="date"
                  value={formData.estimatedContractEnd instanceof Date
                    ? formData.estimatedContractEnd.toISOString().split('T')[0]
                    : ''}
                  onChange={(e) => handleChange('estimatedContractEnd', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Anticipated Duration</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-teal-600">
                  {formData.anticipatedDurationMonths || 0}
                </span>
                <span className="text-slate-500">months</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Third-Party Contract Management</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.thirdPartyContractMgmtRequired}
                  onCheckedChange={(checked) => handleChange('thirdPartyContractMgmtRequired', checked)}
                />
                <span className="text-sm text-slate-500">
                  {formData.thirdPartyContractMgmtRequired ? 'Required' : 'Not Required'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskNotes">Risk Notes</Label>
              <Textarea
                id="riskNotes"
                value={formData.riskNotes || ''}
                onChange={(e) => handleChange('riskNotes', e.target.value)}
                placeholder="Any risks or special considerations..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments || ''}
                onChange={(e) => handleChange('comments', e.target.value)}
                placeholder="Additional comments..."
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="budget" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  min={0}
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitOfMeasureId">Unit of Measure</Label>
                <Select
                  value={formData.unitOfMeasureId || ''}
                  onValueChange={(value) => handleChange('unitOfMeasureId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsOfMeasure.map((uom) => (
                      <SelectItem key={uom.id} value={uom.id}>
                        {uom.abbreviation} - {uom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedUnitCost">Unit Cost (K)</Label>
                <Input
                  id="estimatedUnitCost"
                  type="number"
                  value={formData.estimatedUnitCost || ''}
                  onChange={(e) => handleChange('estimatedUnitCost', parseFloat(e.target.value) || 0)}
                  min={0}
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Total Cost</Label>
                <div className="text-2xl font-bold text-teal-600">
                  {formatCurrency(formData.estimatedTotalCost || 0)}
                </div>
                <p className="text-xs text-slate-500">= Quantity x Unit Cost</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualBudgetYearValue">Annual Budget Value (K) *</Label>
                <Input
                  id="annualBudgetYearValue"
                  type="number"
                  value={formData.annualBudgetYearValue || ''}
                  onChange={(e) => handleChange('annualBudgetYearValue', parseFloat(e.target.value) || 0)}
                  min={0}
                  className={errors.annualBudgetYearValue ? 'border-red-500' : ''}
                />
                {errors.annualBudgetYearValue && (
                  <p className="text-xs text-red-500">{errors.annualBudgetYearValue}</p>
                )}
              </div>
            </div>

            {formData.multiYearFlag && (
              <div className="space-y-2">
                <Label htmlFor="multiYearTotalBudget">Multi-Year Total Budget (K)</Label>
                <Input
                  id="multiYearTotalBudget"
                  type="number"
                  value={formData.multiYearTotalBudget || ''}
                  onChange={(e) => handleChange('multiYearTotalBudget', parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Quarterly Distribution</Label>
                <Button type="button" variant="outline" size="sm" onClick={distributeQuarters}>
                  Distribute Equally
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {['q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'].map((field, idx) => (
                  <div key={field} className="space-y-2">
                    <Label>Q{idx + 1} (K)</Label>
                    <Input
                      type="number"
                      value={(formData as Record<string, unknown>)[field] as number || ''}
                      onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                      min={0}
                      className={errors.q1Budget ? 'border-red-500' : ''}
                    />
                  </div>
                ))}
              </div>
              {errors.q1Budget && (
                <p className="text-xs text-red-500 mt-2">{errors.q1Budget}</p>
              )}

              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Quarter Total:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      (formData.q1Budget || 0) + (formData.q2Budget || 0) +
                      (formData.q3Budget || 0) + (formData.q4Budget || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Annual Value:</span>
                  <span className="font-semibold text-teal-600">
                    {formatCurrency(formData.annualBudgetYearValue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Location Scope</Label>
              <Select
                value={formData.locationScope}
                onValueChange={(value) => handleChange('locationScope', value as LocationScope)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_SCOPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.locationScope === 'provincial' || formData.locationScope === 'district') && (
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={formData.provinceId || ''}
                  onValueChange={(value) => handleChange('provinceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProvinces.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.code} - {prov.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.locationScope === 'district' && formData.provinceId && (
              <div className="space-y-2">
                <Label>District</Label>
                <Select
                  value={formData.districtId || ''}
                  onValueChange={(value) => handleChange('districtId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDistrictsByProvinceId(formData.provinceId).map((dist) => (
                      <SelectItem key={dist.id} value={dist.id}>
                        {dist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="locationNotes">Location Notes</Label>
              <Textarea
                id="locationNotes"
                value={formData.locationNotes || ''}
                onChange={(e) => handleChange('locationNotes', e.target.value)}
                placeholder="Specific locations, sites, or delivery points..."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {item ? 'Update Item' : 'Add Item'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
