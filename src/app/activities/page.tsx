'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Play, Settings, Trash2, Upload, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Activity, ParticipantCSVRow } from '@/lib/types';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [csvParticipants, setCsvParticipants] = useState<ParticipantCSVRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowMultiWin: false,
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      if (data.success) setActivities(data.data);
    } catch {
      toast.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (content: string): { participants: ParticipantCSVRow[]; errors: string[] } => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { participants: [], errors: ['CSV文件为空'] };

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim());

    // Find column indices
    const nameIdx = headers.findIndex(h => h === '姓名' || h === 'name');
    const employeeIdIdx = headers.findIndex(h => h === '工号' || h === 'employeeid' || h === 'employee_id');
    const departmentIdx = headers.findIndex(h => h === '部门' || h === 'department');
    const emailIdx = headers.findIndex(h => h === '邮箱' || h === 'email');

    if (nameIdx === -1) {
      return { participants: [], errors: ['CSV文件缺少姓名列（姓名/name）'] };
    }

    const participants: ParticipantCSVRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const name = values[nameIdx] || '';

      if (!name) {
        errors.push(`第 ${i + 1} 行：姓名不能为空，已跳过`);
        continue;
      }

      participants.push({
        name,
        employeeId: employeeIdIdx >= 0 ? values[employeeIdIdx] || '' : '',
        department: departmentIdx >= 0 ? values[departmentIdx] || '' : '',
        email: emailIdx >= 0 ? values[emailIdx] || '' : '',
      });
    }

    return { participants, errors };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { participants, errors } = parseCSV(content);
      setCsvParticipants(participants);
      setCsvErrors(errors);
      if (errors.length > 0) {
        toast.warning(`解析完成，有 ${errors.length} 条警告`);
      } else if (participants.length > 0) {
        toast.success(`成功解析 ${participants.length} 名参与人员`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    window.open('/api/templates/participants', '_blank');
  };

  const removeParticipant = (index: number) => {
    setCsvParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入活动名称');
      return;
    }
    if (csvParticipants.length === 0) {
      toast.error('请至少导入一名参与人员');
      return;
    }
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, participants: csvParticipants }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('创建成功');
        setIsCreateDialogOpen(false);
        setFormData({ name: '', description: '', allowMultiWin: false });
        setCsvParticipants([]);
        setCsvErrors([]);
        fetchActivities();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch {
      toast.error('创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该活动吗？')) return;
    try {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchActivities();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const resetDialog = () => {
    setFormData({ name: '', description: '', allowMultiWin: false });
    setCsvParticipants([]);
    setCsvErrors([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">抽奖活动</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetDialog();
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />创建活动</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>创建抽奖活动</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>活动名称 *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="例如：年会抽奖"
                />
              </div>
              <div>
                <Label>活动描述</Label>
                <Input
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="活动说明"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>允许多次中奖</Label>
                  <p className="text-sm text-slate-500">开启后同一人可在不同轮次中奖</p>
                </div>
                <Switch
                  checked={formData.allowMultiWin}
                  onCheckedChange={v => setFormData({...formData, allowMultiWin: v})}
                />
              </div>

              {/* CSV Import Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label>导入参与人员 *</Label>
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />下载模板
                  </Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 mb-2">点击或拖拽 CSV 文件到此处</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    选择文件
                  </Button>
                </div>

                {csvErrors.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">解析警告：</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {csvErrors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {csvErrors.length > 5 && <li>...还有 {csvErrors.length - 5} 条警告</li>}
                    </ul>
                  </div>
                )}

                {csvParticipants.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">
                      已导入 {csvParticipants.length} 名参与人员：
                    </p>
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>姓名</TableHead>
                            <TableHead>工号</TableHead>
                            <TableHead>部门</TableHead>
                            <TableHead>邮箱</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvParticipants.map((p, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell>{p.employeeId || '-'}</TableCell>
                              <TableCell>{p.department || '-'}</TableCell>
                              <TableCell>{p.email || '-'}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeParticipant(idx)}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={csvParticipants.length === 0}>
                创建活动
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">加载中...</div>
      ) : activities.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-slate-500">暂无活动，点击上方按钮创建</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map(activity => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{activity.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardTitle>
                <CardDescription>{activity.description || '暂无描述'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <p>多次中奖：{activity.allowMultiWin ? '允许' : '不允许'}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/activities/${activity.id}`} className="flex-1">
                    <Button variant="outline" className="w-full"><Settings className="h-4 w-4 mr-2" />配置</Button>
                  </Link>
                  <Link href={`/activities/${activity.id}/lottery`} className="flex-1">
                    <Button className="w-full"><Play className="h-4 w-4 mr-2" />抽奖</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
