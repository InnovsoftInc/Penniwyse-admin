import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { Button, Modal, Input, Select } from '../../ui';
import { adminGamificationService } from '../../../services/api/admin-gamification.service';
import type { GamificationConfig, XPLevel, QuestRule, CreateQuestRuleDto, UpdateQuestRuleDto } from '../../../types/gamification.types';

interface ConfigFormProps {
  config: GamificationConfig;
  onSaveXPLevels: (xpLevels: XPLevel[]) => Promise<void>;
  onCreateQuestRule: (data: CreateQuestRuleDto) => Promise<void>;
  onUpdateQuestRule: (id: number | string, data: UpdateQuestRuleDto) => Promise<void>;
  onDeleteQuestRule: (id: number | string) => Promise<void>;
  isLoading?: boolean;
}

export function ConfigForm({
  config,
  onSaveXPLevels,
  onCreateQuestRule,
  onUpdateQuestRule,
  onDeleteQuestRule,
  isLoading = false,
}: ConfigFormProps) {
  const [xpLevels, setXpLevels] = useState<XPLevel[]>(config.xpLevels || []);
  const [questRules, setQuestRules] = useState<QuestRule[]>(config.questRules || []);
  const [isQuestRuleModalOpen, setIsQuestRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<QuestRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState<{
    id: string;
    trigger: string;
    description: string;
    xp?: number;
    badge: string;
    questSlug: string;
    conditions: string;
    rewards: string;
  }>({
    id: '',
    trigger: '',
    description: '',
    xp: undefined,
    badge: '',
    questSlug: '',
    conditions: '',
    rewards: '',
  });
  const [xpLevelsChanged, setXpLevelsChanged] = useState(false);
  const [availableBadges, setAvailableBadges] = useState<Array<{ key: string; name: string; isActive: boolean }>>([]);
  const [availableQuests, setAvailableQuests] = useState<Array<{ slug: string; name: string; isActive: boolean }>>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  useEffect(() => {
    console.log('ConfigForm: Config received:', config);
    console.log('ConfigForm: config.questRules:', config.questRules);
    console.log('ConfigForm: config.questRules is array?', Array.isArray(config.questRules));
    
    const xpLevelsArray = Array.isArray(config.xpLevels) ? config.xpLevels : [];
    
    // Handle questRules - could be an array, an object with 'rules' property, or undefined
    let questRulesArray: QuestRule[] = [];
    if (Array.isArray(config.questRules)) {
      questRulesArray = config.questRules;
    } else if (config.questRules && typeof config.questRules === 'object') {
      // Check if it's an object with a 'rules' property (backend format: {rules: Array})
      const questRulesObj = config.questRules as { rules?: QuestRule[] };
      if (Array.isArray(questRulesObj.rules)) {
        questRulesArray = questRulesObj.rules;
      }
    }
    
    console.log('ConfigForm: Setting questRules to:', questRulesArray);
    console.log('ConfigForm: questRules length:', questRulesArray.length);
    
    setXpLevels(xpLevelsArray);
    setQuestRules(questRulesArray);
  }, [config]);

  const handleAddXPLevel = () => {
    const nextLevel = xpLevels.length > 0 ? Math.max(...xpLevels.map(l => l.level)) + 1 : 1;
    setXpLevels([...xpLevels, { level: nextLevel, xpRequired: 0 }]);
    setXpLevelsChanged(true);
  };

  const handleUpdateXPLevel = (index: number, field: 'level' | 'xpRequired', value: number) => {
    const updated = [...xpLevels];
    updated[index] = { ...updated[index], [field]: value };
    setXpLevels(updated);
    setXpLevelsChanged(true);
  };

  const handleRemoveXPLevel = (index: number) => {
    const updated = xpLevels.filter((_, i) => i !== index);
    setXpLevels(updated);
    setXpLevelsChanged(true);
  };

  const handleSaveXPLevels = async () => {
    await onSaveXPLevels(xpLevels);
    setXpLevelsChanged(false);
  };

  const loadAvailableLinks = async () => {
    try {
      setIsLoadingLinks(true);
      console.log('Loading available badges and quests...');
      
      const [badgesResponse, questsResponse] = await Promise.all([
        adminGamificationService.getAvailableBadges(),
        adminGamificationService.getAvailableQuests(),
      ]);
      
      console.log('Raw badges response:', badgesResponse);
      console.log('Raw quests response:', questsResponse);
      
      // Handle badges - check multiple possible response formats
      let badgesArray: Array<{ key: string; name: string; isActive: boolean }> = [];
      if (Array.isArray(badgesResponse)) {
        badgesArray = badgesResponse;
      } else if (badgesResponse && typeof badgesResponse === 'object') {
        // Try badges property first (backend format: {badges: Array, message: "..."})
        const responseWithBadges = badgesResponse as { badges?: Array<{ key: string; name: string; isActive: boolean }> };
        if (Array.isArray(responseWithBadges.badges)) {
          badgesArray = responseWithBadges.badges;
        } 
        // Try items property (paginated format: {items: Array, meta: {...}})
        else if (Array.isArray((badgesResponse as { items?: Array<{ key: string; name: string; isActive: boolean }> }).items)) {
          badgesArray = (badgesResponse as { items: Array<{ key: string; name: string; isActive: boolean }> }).items;
        } else {
          console.warn('Badges response is not an array and has no badges/items property:', badgesResponse);
        }
      } else {
        console.warn('Badges response is not an array:', badgesResponse);
      }
      
      // Handle quests - check multiple possible response formats
      let questsArray: Array<{ slug: string; name: string; isActive: boolean }> = [];
      if (Array.isArray(questsResponse)) {
        questsArray = questsResponse;
      } else if (questsResponse && typeof questsResponse === 'object') {
        // Try quests property first (backend format: {quests: Array, message: "..."})
        const responseWithQuests = questsResponse as { quests?: Array<{ slug: string; name: string; isActive: boolean }> };
        if (Array.isArray(responseWithQuests.quests)) {
          questsArray = responseWithQuests.quests;
        }
        // Try items property (paginated format: {items: Array, meta: {...}})
        else if (Array.isArray((questsResponse as { items?: Array<{ slug: string; name: string; isActive: boolean }> }).items)) {
          questsArray = (questsResponse as { items: Array<{ slug: string; name: string; isActive: boolean }> }).items;
        } else {
          console.warn('Quests response is not an array and has no quests/items property:', questsResponse);
        }
      } else {
        console.warn('Quests response is not an array:', questsResponse);
      }
      
      console.log('Loaded badges:', badgesArray);
      console.log('Loaded quests:', questsArray);
      
      setAvailableBadges(badgesArray);
      setAvailableQuests(questsArray);
    } catch (err: unknown) {
      console.error('Failed to load available badges/quests:', err);
      
      // Log detailed error information
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: unknown; headers?: unknown }; request?: unknown };
        console.error('Error response status:', axiosError.response?.status);
        console.error('Error response data:', axiosError.response?.data);
        console.error('Error response headers:', axiosError.response?.headers);
      } else if (err && typeof err === 'object' && 'request' in err) {
        const axiosError = err as { request?: unknown };
        console.error('Request was made but no response received:', axiosError.request);
      } else if (err && typeof err === 'object' && 'message' in err) {
        console.error('Error setting up request:', (err as { message: unknown }).message);
      } else {
        console.error('Unknown error:', err);
      }
      
      setAvailableBadges([]);
      setAvailableQuests([]);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleOpenQuestRuleModal = async (rule?: QuestRule) => {
    await loadAvailableLinks();
    
    if (rule) {
      setEditingRule(rule);
      setRuleFormData({
        id: typeof rule.id === 'string' ? rule.id : String(rule.id),
        trigger: rule.trigger || '',
        description: rule.description || '',
        xp: rule.xp,
        badge: rule.badge || '',
        questSlug: rule.questSlug || '',
        conditions: typeof rule.conditions === 'string' 
          ? rule.conditions 
          : rule.conditions 
            ? JSON.stringify(rule.conditions, null, 2)
            : '',
        rewards: typeof rule.rewards === 'string'
          ? rule.rewards
          : rule.rewards
            ? JSON.stringify(rule.rewards, null, 2)
            : '',
      });
    } else {
      setEditingRule(null);
      setRuleFormData({
        id: '',
        trigger: '',
        description: '',
        xp: undefined,
        badge: '',
        questSlug: '',
        conditions: '',
        rewards: '',
      });
    }
    setIsQuestRuleModalOpen(true);
  };

  const handleSaveQuestRule = async () => {
    try {
      if (editingRule) {
        const updateData: UpdateQuestRuleDto = {
          trigger: ruleFormData.trigger?.trim() || undefined,
          description: ruleFormData.description?.trim() || undefined,
          xp: ruleFormData.xp !== undefined && ruleFormData.xp !== null ? ruleFormData.xp : undefined,
          badge: ruleFormData.badge?.trim() || undefined,
          questSlug: ruleFormData.questSlug?.trim() || undefined,
          conditions: ruleFormData.conditions?.trim()
            ? (ruleFormData.conditions.trim().startsWith('{') || ruleFormData.conditions.trim().startsWith('[')
                ? JSON.parse(ruleFormData.conditions.trim())
                : ruleFormData.conditions.trim())
            : undefined,
          rewards: ruleFormData.rewards?.trim()
            ? (ruleFormData.rewards.trim().startsWith('{') || ruleFormData.rewards.trim().startsWith('[')
                ? JSON.parse(ruleFormData.rewards.trim())
                : ruleFormData.rewards.trim())
            : undefined,
        };

        // Remove undefined and empty string values
        Object.keys(updateData).forEach(key => {
          const value = updateData[key as keyof UpdateQuestRuleDto];
          if (value === undefined || value === '' || value === null) {
            delete updateData[key as keyof UpdateQuestRuleDto];
          }
        });

        console.log('Updating quest rule with data:', JSON.stringify(updateData, null, 2));
        await onUpdateQuestRule(typeof editingRule.id === 'number' ? editingRule.id : parseInt(String(editingRule.id)), updateData);
      } else {
        // Validate trigger is provided
        if (!ruleFormData.trigger || ruleFormData.trigger.trim() === '') {
          alert('Trigger is required');
          return;
        }

        // Generate ID from trigger if not provided (e.g., "add_income" -> "r_add_income")
        const ruleId = ruleFormData.id?.trim() || `r_${ruleFormData.trigger.trim()}`;

        const createData: CreateQuestRuleDto = {
          id: ruleId,
          trigger: ruleFormData.trigger.trim(),
          description: ruleFormData.description?.trim() || undefined,
          xp: ruleFormData.xp !== undefined && ruleFormData.xp !== null ? ruleFormData.xp : undefined,
          badge: ruleFormData.badge?.trim() || undefined,
          questSlug: ruleFormData.questSlug?.trim() || undefined,
          conditions: ruleFormData.conditions?.trim()
            ? (ruleFormData.conditions.trim().startsWith('{') || ruleFormData.conditions.trim().startsWith('[')
                ? JSON.parse(ruleFormData.conditions.trim())
                : ruleFormData.conditions.trim())
            : undefined,
          rewards: ruleFormData.rewards?.trim()
            ? (ruleFormData.rewards.trim().startsWith('{') || ruleFormData.rewards.trim().startsWith('[')
                ? JSON.parse(ruleFormData.rewards.trim())
                : ruleFormData.rewards.trim())
            : undefined,
        };

        // Remove undefined values to avoid sending them
        Object.keys(createData).forEach(key => {
          if (createData[key as keyof CreateQuestRuleDto] === undefined) {
            delete createData[key as keyof CreateQuestRuleDto];
          }
        });

        console.log('Creating quest rule with data:', createData);
        await onCreateQuestRule(createData);
      }
      setIsQuestRuleModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      console.error('Error saving quest rule:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to save quest rule. Please check your inputs.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; error?: string }; status?: number } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.status === 400) {
          errorMessage = 'Bad Request: Invalid data. Please check that trigger, badge key, and quest slug are valid.';
        } else if (axiosError.response?.status) {
          errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.data || 'Request failed'}`;
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      }
      
      console.error('Full error details:', err);
      alert(errorMessage);
    }
  };

  const handleDeleteQuestRule = async (id: number) => {
    if (confirm('Are you sure you want to delete this quest rule?')) {
      await onDeleteQuestRule(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* XP Levels Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">XP Levels</h3>
            <p className="text-sm text-gray-500 mt-1">Configure level thresholds. Users accumulate XP from quest rules to reach these levels.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddXPLevel}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Level
            </Button>
            {xpLevelsChanged && (
              <Button
                size="sm"
                onClick={handleSaveXPLevels}
                isLoading={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Level</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">XP Required</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {xpLevels.map((level, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="1"
                      value={level.level}
                      onChange={(e) => handleUpdateXPLevel(index, 'level', parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      value={level.xpRequired}
                      onChange={(e) => handleUpdateXPLevel(index, 'xpRequired', parseInt(e.target.value) || 0)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveXPLevel(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
              {xpLevels.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No XP levels configured. Click "Add Level" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quest Rules Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Quest Rules</h3>
            <p className="text-sm text-gray-500 mt-1">Define action → reward mappings. When users perform actions, these rules determine XP amounts, badges, and quest completion.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenQuestRuleModal()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
        <div className="space-y-2">
          {(() => {
            console.log('ConfigForm: Rendering quest rules. questRules:', questRules);
            console.log('ConfigForm: questRules is array?', Array.isArray(questRules));
            console.log('ConfigForm: questRules type:', typeof questRules);
            return null;
          })()}
          {Array.isArray(questRules) && questRules.map((rule) => {
            console.log('ConfigForm: Rendering rule:', rule);
            return (
              <div key={rule.id} className="border rounded-lg p-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{rule.trigger || `Rule ${rule.id}`}</h4>
                    {rule.id && (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{rule.id}</code>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {rule.xp !== undefined && (
                      <span>XP: <strong className="text-gray-700">{rule.xp}</strong></span>
                    )}
                    {rule.badge && (
                      <span>Badge: <code className="bg-gray-100 px-1 rounded">{rule.badge}</code></span>
                    )}
                    {rule.questSlug && (
                      <span>Quest: <code className="bg-gray-100 px-1 rounded">{rule.questSlug}</code></span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenQuestRuleModal(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestRule(typeof rule.id === 'number' ? rule.id : parseInt(String(rule.id)))}
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            );
          })}
          {(!Array.isArray(questRules) || questRules.length === 0) && (
            <div className="py-8 text-center text-gray-500">
              No quest rules configured. Click "Add Rule" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Quest Rule Modal */}
      <Modal
        isOpen={isQuestRuleModalOpen}
        onClose={() => {
          setIsQuestRuleModalOpen(false);
          setEditingRule(null);
        }}
        title={editingRule ? 'Edit Quest Rule' : 'Create Quest Rule'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Rule ID (optional)"
            placeholder="r_add_income"
            value={ruleFormData.id}
            onChange={(e) => setRuleFormData({ ...ruleFormData, id: e.target.value })}
            helperText="Unique rule identifier (e.g., 'r_add_income'). Auto-generated from trigger if not provided."
          />
          
          <Input
            label="Trigger"
            placeholder="add_income"
            value={ruleFormData.trigger}
            onChange={(e) => setRuleFormData({ ...ruleFormData, trigger: e.target.value })}
            required
            helperText="Event trigger identifier (e.g., 'add_income', 'complete_transaction'). This event fires when users perform the action."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={ruleFormData.description || ''}
              onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="XP Reward"
              type="number"
              min="0"
              value={ruleFormData.xp || ''}
              onChange={(e) => setRuleFormData({ ...ruleFormData, xp: e.target.value ? parseInt(e.target.value) : undefined })}
              helperText="XP amount to award (e.g., 25, 50, 150). Users accumulate XP to reach levels."
            />
            
            <Select
              label="Badge (optional)"
              options={[
                { value: '', label: 'None' },
                ...(Array.isArray(availableBadges) && availableBadges.length > 0 
                  ? availableBadges.map(badge => ({
                      value: badge.key || '',
                      label: `${badge.name || 'Unnamed'}${badge.key ? ` (${badge.key})` : ''}`,
                    }))
                  : []),
              ]}
              value={ruleFormData.badge || ''}
              onChange={(e) => setRuleFormData({ ...ruleFormData, badge: e.target.value })}
              placeholder={isLoadingLinks ? 'Loading badges...' : availableBadges.length === 0 ? 'No badges available' : 'Select a badge'}
              disabled={isLoadingLinks}
            />
          </div>

          <Select
            label="Quest Slug (optional)"
            options={[
              { value: '', label: 'None' },
              ...(Array.isArray(availableQuests) && availableQuests.length > 0
                ? availableQuests.map(quest => ({
                    value: quest.slug || '',
                    label: `${quest.name || 'Unnamed'}${quest.slug ? ` (${quest.slug})` : ''}`,
                  }))
                : []),
            ]}
            value={ruleFormData.questSlug || ''}
            onChange={(e) => setRuleFormData({ ...ruleFormData, questSlug: e.target.value })}
            placeholder={isLoadingLinks ? 'Loading quests...' : availableQuests.length === 0 ? 'No quests available' : 'Select a quest'}
            helperText="Link this rule to a quest completion"
            disabled={isLoadingLinks}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conditions (JSON, optional)
            </label>
            <textarea
              value={typeof ruleFormData.conditions === 'string' ? ruleFormData.conditions : ''}
              onChange={(e) => setRuleFormData({ ...ruleFormData, conditions: e.target.value })}
              rows={4}
              placeholder='{"minLevel": 5}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Enter valid JSON or plain text</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rewards (JSON, optional)
            </label>
            <textarea
              value={typeof ruleFormData.rewards === 'string' ? ruleFormData.rewards : ''}
              onChange={(e) => setRuleFormData({ ...ruleFormData, rewards: e.target.value })}
              rows={4}
              placeholder='{"xp": 100, "badgeId": 1}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Enter valid JSON or plain text</p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveQuestRule} isLoading={isLoading || isLoadingLinks}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsQuestRuleModalOpen(false);
                setEditingRule(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

