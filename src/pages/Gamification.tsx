import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import { Card, Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../components/ui';
import { QuestForm, BadgeForm, ConfigForm, BadgeIcon } from '../components/features/gamification';
import { adminGamificationService } from '../services/api/admin-gamification.service';
import type { Quest, Badge, GamificationConfig, CreateQuestDto, UpdateQuestDto, CreateBadgeDto, UpdateBadgeDto, QuestRule } from '../types/gamification.types';

export function Gamification() {
  const [activeTab, setActiveTab] = useState<'quests' | 'badges' | 'configuration'>('quests');
  
  // Quests state
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isQuestsLoading, setIsQuestsLoading] = useState(true);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [questSearchTerm, setQuestSearchTerm] = useState('');
  
  // Badges state
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isBadgesLoading, setIsBadgesLoading] = useState(true);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [badgeSearchTerm, setBadgeSearchTerm] = useState('');
  
  // Config state
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [isQuestActionLoading, setIsQuestActionLoading] = useState(false);
  const [isBadgeActionLoading, setIsBadgeActionLoading] = useState(false);
  const [deletingQuestId, setDeletingQuestId] = useState<number | null>(null);
  const [deletingBadgeId, setDeletingBadgeId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'quests') {
      loadQuests();
      // Also load badges for the dropdown
      if (badges.length === 0) {
        loadBadges();
      }
    } else if (activeTab === 'badges') {
      loadBadges();
    } else if (activeTab === 'configuration') {
      loadConfig();
    }
  }, [activeTab]);

  // Quests
  const loadQuests = async () => {
    try {
      setIsQuestsLoading(true);
      setError(null);
      const response = await adminGamificationService.getQuests();
      // Handle paginated response with items array
      const questsArray = response?.items || (Array.isArray(response) ? response : []);
      // Map API fields to our Quest type (title -> name, xp -> xpReward)
      const mappedQuests = questsArray.map((quest: any) => ({
        ...quest,
        name: quest.name || quest.title || '',
        description: quest.description || '',
        xpReward: quest.xpReward !== undefined ? quest.xpReward : (quest.xp !== undefined ? quest.xp : 0),
      }));
      setQuests(mappedQuests);
    } catch (err) {
      setError('Failed to load quests');
      setQuests([]);
      console.error(err);
    } finally {
      setIsQuestsLoading(false);
    }
  };

  const handleCreateQuest = async (data: CreateQuestDto | UpdateQuestDto) => {
    try {
      setIsQuestActionLoading(true);
      if (editingQuest) {
        await adminGamificationService.updateQuest(editingQuest.id, data);
      } else {
        await adminGamificationService.createQuest(data as CreateQuestDto);
      }
      setIsQuestModalOpen(false);
      setEditingQuest(null);
      await loadQuests();
    } catch (err) {
      throw err;
    } finally {
      setIsQuestActionLoading(false);
    }
  };

  const handleDeleteQuest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quest? This action cannot be undone.')) return;
    try {
      setDeletingQuestId(id);
      await adminGamificationService.deleteQuest(id);
      await loadQuests();
    } catch (err) {
      setError('Failed to delete quest');
      console.error(err);
    } finally {
      setDeletingQuestId(null);
    }
  };

  // Badges
  const loadBadges = async () => {
    try {
      setIsBadgesLoading(true);
      setError(null);
      const response = await adminGamificationService.getBadges();
      // Handle paginated response with items array
      const badgesArray = response?.items || (Array.isArray(response) ? response : []);
      setBadges(badgesArray);
    } catch (err) {
      setError('Failed to load badges');
      setBadges([]);
      console.error(err);
    } finally {
      setIsBadgesLoading(false);
    }
  };

  const handleCreateBadge = async (data: CreateBadgeDto | UpdateBadgeDto) => {
    try {
      setIsBadgeActionLoading(true);
      if (editingBadge) {
        // Remove slug from update payload as backend doesn't accept it
        const { slug, ...updateData } = data as UpdateBadgeDto & { slug?: string };
        await adminGamificationService.updateBadge(editingBadge.id, updateData);
      } else {
        await adminGamificationService.createBadge(data as CreateBadgeDto);
      }
      setIsBadgeModalOpen(false);
      setEditingBadge(null);
      await loadBadges();
    } catch (err) {
      throw err;
    } finally {
      setIsBadgeActionLoading(false);
    }
  };

  const handleDeleteBadge = async (id: number) => {
    if (!confirm('Are you sure you want to delete this badge? This action cannot be undone.')) return;
    try {
      setDeletingBadgeId(id);
      await adminGamificationService.deleteBadge(id);
      await loadBadges();
    } catch (err) {
      setError('Failed to delete badge');
      console.error(err);
    } finally {
      setDeletingBadgeId(null);
    }
  };

  // Config
  const loadConfig = async () => {
    try {
      setIsConfigLoading(true);
      setError(null);
      // Fetch config and quest rules in parallel
      const [configData, questRules] = await Promise.all([
        adminGamificationService.getConfig(),
        adminGamificationService.getQuestRules().catch(() => []), // Fallback to empty array if endpoint doesn't exist
      ]);
      
      console.log('Gamification: configData:', configData);
      console.log('Gamification: questRules from endpoint:', questRules);
      
      // Handle quest rules - could be in configData.rules, configData.questRules.rules, or from separate endpoint
      let finalQuestRules: QuestRule[] = [];
      if (Array.isArray(questRules) && questRules.length > 0) {
        finalQuestRules = questRules;
      } else if (Array.isArray((configData as any).rules)) {
        finalQuestRules = (configData as any).rules;
      } else if (configData.questRules) {
        if (Array.isArray(configData.questRules)) {
          finalQuestRules = configData.questRules;
        } else if (typeof configData.questRules === 'object' && Array.isArray((configData.questRules as any).rules)) {
          finalQuestRules = (configData.questRules as any).rules;
        }
      }
      
      console.log('Gamification: Final questRules:', finalQuestRules);
      
      // Merge quest rules into config
      setConfig({
        ...configData,
        questRules: finalQuestRules,
      });
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const [isConfigActionLoading, setIsConfigActionLoading] = useState(false);

  const handleSaveXPLevels = async (xpLevels: typeof config.xpLevels) => {
    try {
      setIsConfigActionLoading(true);
      await adminGamificationService.updateXPLevels({ xpLevels });
      await loadConfig();
    } catch (err) {
      throw err;
    } finally {
      setIsConfigActionLoading(false);
    }
  };

  const handleCreateQuestRule = async (data: Parameters<typeof adminGamificationService.createQuestRule>[0]) => {
    try {
      setIsConfigActionLoading(true);
      await adminGamificationService.createQuestRule(data);
      await loadConfig();
    } catch (err) {
      throw err;
    } finally {
      setIsConfigActionLoading(false);
    }
  };

  const handleUpdateQuestRule = async (id: number | string, data: Parameters<typeof adminGamificationService.updateQuestRule>[1]) => {
    try {
      setIsConfigActionLoading(true);
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      await adminGamificationService.updateQuestRule(numericId, data);
      await loadConfig();
    } catch (err) {
      throw err;
    } finally {
      setIsConfigActionLoading(false);
    }
  };

  const handleDeleteQuestRule = async (id: number | string) => {
    try {
      setIsConfigActionLoading(true);
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      await adminGamificationService.deleteQuestRule(numericId);
      await loadConfig();
    } catch (err) {
      throw err;
    } finally {
      setIsConfigActionLoading(false);
    }
  };

  // Filter quests and badges
  const filteredQuests = (Array.isArray(quests) ? quests : []).filter(quest =>
    quest.name.toLowerCase().includes(questSearchTerm.toLowerCase()) ||
    quest.description.toLowerCase().includes(questSearchTerm.toLowerCase()) ||
    quest.slug?.toLowerCase().includes(questSearchTerm.toLowerCase()) ||
    quest.category?.toLowerCase().includes(questSearchTerm.toLowerCase())
  );

  const filteredBadges = (Array.isArray(badges) ? badges : []).filter(badge =>
    badge.name.toLowerCase().includes(badgeSearchTerm.toLowerCase()) ||
    badge.description?.toLowerCase().includes(badgeSearchTerm.toLowerCase()) ||
    badge.key?.toLowerCase().includes(badgeSearchTerm.toLowerCase()) ||
    badge.slug?.toLowerCase().includes(badgeSearchTerm.toLowerCase()) ||
    badge.category?.toLowerCase().includes(badgeSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gamification Management</h1>
          <p className="text-gray-600 mt-1">Manage quests, badges, and gamification configuration</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['quests', 'badges', 'configuration'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quests</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search quests..."
                  value={questSearchTerm}
                  onChange={(e) => setQuestSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={loadQuests}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  setEditingQuest(null);
                  setIsQuestModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Quest
              </Button>
            </div>
          </div>

          <Table isLoading={isQuestsLoading} emptyMessage="No quests found">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>XP Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuests.map((quest) => (
                <TableRow key={quest.id}>
                  <TableCell className="font-medium">{quest.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${
                      quest.type === 'daily' ? 'bg-blue-100 text-blue-700' :
                      quest.type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                      quest.type === 'monthly' ? 'bg-pink-100 text-pink-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {quest.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {quest.category ? (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100">{quest.category}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{quest.xpReward}</TableCell>
                  <TableCell>
                    {quest.isActive !== undefined ? (
                      <span className={`px-2 py-1 text-xs rounded ${
                        quest.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {quest.isActive ? 'Active' : 'Inactive'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{quest.slug || '-'}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingQuest(quest);
                          setIsQuestModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuest(quest.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
            </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Badges</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search badges..."
                  value={badgeSearchTerm}
                  onChange={(e) => setBadgeSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={loadBadges}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  setEditingBadge(null);
                  setIsBadgeModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Badge
              </Button>
            </div>
            </div>

          <Table isLoading={isBadgesLoading} emptyMessage="No badges found">
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBadges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    {badge.icon ? (
                      <BadgeIcon icon={badge.icon} size="md" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{badge.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{badge.key || '-'}</code>
                  </TableCell>
                  <TableCell>
                    {badge.category ? (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100">{badge.category}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{badge.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBadge(badge);
                          setIsBadgeModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBadge(badge.id)}
                        isLoading={deletingBadgeId === badge.id}
                        disabled={deletingBadgeId === badge.id}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <Card>
          {isConfigLoading ? (
            <div className="text-center py-12 text-gray-500">Loading configuration...</div>
          ) : config ? (
            <ConfigForm
              config={config}
              onSaveXPLevels={handleSaveXPLevels}
              onCreateQuestRule={handleCreateQuestRule}
              onUpdateQuestRule={handleUpdateQuestRule}
              onDeleteQuestRule={handleDeleteQuestRule}
              isLoading={isConfigActionLoading}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">No configuration available</div>
          )}
        </Card>
      )}

      {/* Quest Modal */}
      <Modal
        isOpen={isQuestModalOpen}
        onClose={() => {
          setIsQuestModalOpen(false);
          setEditingQuest(null);
        }}
        title={editingQuest ? 'Edit Quest' : 'Create Quest'}
        size="md"
      >
        <QuestForm
          onSubmit={handleCreateQuest}
          onCancel={() => {
            setIsQuestModalOpen(false);
            setEditingQuest(null);
          }}
          initialData={editingQuest || undefined}
          isLoading={isQuestActionLoading}
        />
      </Modal>

      {/* Badge Modal */}
      <Modal
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setEditingBadge(null);
        }}
        title={editingBadge ? 'Edit Badge' : 'Create Badge'}
        size="md"
      >
        <BadgeForm
          onSubmit={handleCreateBadge}
          onCancel={() => {
            setIsBadgeModalOpen(false);
            setEditingBadge(null);
          }}
          initialData={editingBadge || undefined}
          isLoading={isBadgeActionLoading}
        />
      </Modal>
    </div>
  );
}
