'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Play, ArrowLeft, Download, Upload, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { LotteryMode } from '@/lib/types';
import type { ActivityWithRounds, Round, Participant } from '@/lib/types';

const LOTTERY_MODES: { value: LotteryMode; label: string }[] = [
  { value: LotteryMode.WHEEL, label: '转盘' },
  { value: LotteryMode.DOUBLE_BALL, label: '双色球' },
  { value: LotteryMode.SCRATCH, label: '刮刮乐' },
  { value: LotteryMode.ZUMA, label: '祖玛' },
  { value: LotteryMode.HORSE_RACE, label: '赛马' },
  { value: LotteryMode.SLOT_MACHINE, label: '老虎机' },
];

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityWithRounds | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddRoundOpen, setIsAddRoundOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [roundForm, setRoundForm] = useState({
    prizeName: '',
    prizeDescription: '',
    winnerCount: 1,
    lotteryMode: LotteryMode.WHEEL,
    animationDurationMs: 60000
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActivity();
    fetchParticipants();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${id}`);
      const data = await res.json();
      if (data.success) setActivity(data.data);
      else toast.error('活动不存在');
    } catch {
      toast.error('获取活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/activities/${id}/participants`);
      const data = await res.json();
      if (data.success) setParticipants(data.data);
    } catch {
      console.error('获取参与人员失败');
    }
  };

  const handleAddRound = async () => {
    if (!roundForm.prizeName.trim()) { toast.error('请输入奖品名称'); return; }
    try {
      const res = await fetch(`/api/activities/${id}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roundForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('添加成功');
        setIsAddRoundOpen(false);
        setRoundForm({ prizeName: '', prizeDescription: '', winnerCount: 1, lotteryMode: LotteryMode.WHEEL, animationDurationMs: 60000 });
        fetchActivity();
      } else toast.error(data.error || '添加失败');
    } catch { toast.error('添加失败'); }
  };

  const handleUpdateRound = async () => {
    if (!editingRound) return;
    try {
      const res = await fetch(`/api/rounds/${editingRound.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roundForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('更新成功');
        setEditingRound(null);
        fetchActivity();
      } else toast.error(data.error || '更新失败');
    } catch { toast.error('更新失败'); }
  };

  const handleDeleteRound = async (roundId: number) => {
    if (!confirm('确定要删除该轮次吗？')) return;
    try {
      const res = await fetch(`/api/rounds/${roundId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('删除成功'); fetchActivity(); }
      else toast.error(data.error || '删除失败');
    } catch { toast.error('删除失败'); }
  };

  const openEditRound = (round: Round) => {
    setEditingRound(round);
    setRoundForm({
      prizeName: round.prizeName,
      prizeDescription: round.prizeDescription,
      winnerCount: round.winnerCount,
      lotteryMode: round.lotteryMode,
      animationDurationMs: round.animationDurationMs || 60000,
    });
  };

  const handleExport = () => {
    window.open(`/api/export/activity/${id}`, '_blank');
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/activities/${id}/participants/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`导入完成：成功 ${data.data.success} 条，失败 ${data.data.failed} 条`);
        fetchParticipants();
      } else {
        toast.error(data.error || '导入失败');
      }
    } catch {
      toast.error('导入失败');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    if (!confirm('确定要删除该参与人员吗？')) return;
    try {
      const res = await fetch(`/api/activities/${id}/participants/${participantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchParticipants();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name.includes(searchTerm) ||
    p.employeeId.includes(searchTerm) ||
    p.department.includes(searchTerm)
  );

  if (loading) return <div className="text-center py-8">加载中...</div>;
  if (!activity) return <div className="text-center py-8">活动不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />返回</Button>
        <h1 className="text-2xl font-bold">{activity.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>抽奖轮次 ({activity.rounds.length})</CardTitle>
            <Dialog open={isAddRoundOpen} onOpenChange={setIsAddRoundOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />添加轮次</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>添加抽奖轮次</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>奖品名称 *</Label><Input value={roundForm.prizeName} onChange={e => setRoundForm({...roundForm, prizeName: e.target.value})} placeholder="例如：一等奖" /></div>
                  <div><Label>奖品描述</Label><Input value={roundForm.prizeDescription} onChange={e => setRoundForm({...roundForm, prizeDescription: e.target.value})} placeholder="例如：iPhone 15" /></div>
                  <div><Label>中奖人数</Label><Input type="number" value={roundForm.winnerCount} onChange={e => setRoundForm({...roundForm, winnerCount: Number(e.target.value)})} min={1} /></div>
                  <div><Label>抽奖模式</Label>
                    <Select value={roundForm.lotteryMode} onValueChange={v => setRoundForm({...roundForm, lotteryMode: v as LotteryMode})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LOTTERY_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>动画时长（秒）</Label><Input type="number" value={roundForm.animationDurationMs / 1000} onChange={e => setRoundForm({...roundForm, animationDurationMs: Number(e.target.value) * 1000})} min={10} max={300} /></div>
                  <Button onClick={handleAddRound} className="w-full">添加</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {activity.rounds.length === 0 ? (
              <p className="text-center text-slate-500 py-8">暂无轮次，请添加</p>
            ) : (
              <div className="space-y-3">
                {activity.rounds.map((round, idx) => (
                  <div key={round.id} className={`p-4 border rounded-lg ${round.isDrawn ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">第 {idx + 1} 轮：{round.prizeName}</span>
                          {round.isDrawn && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">已抽奖</span>}
                        </div>
                        <p className="text-sm text-slate-500">{round.prizeDescription || '无描述'}</p>
                        <p className="text-sm text-slate-500">
                          中奖人数：{round.winnerCount} |
                          模式：{LOTTERY_MODES.find(m => m.value === round.lotteryMode)?.label} |
                          动画：{(round.animationDurationMs || 60000) / 1000}秒
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditRound(round)} disabled={round.isDrawn}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRound(round.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>活动信息</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-slate-500">描述：</span>{activity.description || '无'}</p>
              <p><span className="text-slate-500">多次中奖：</span>{activity.allowMultiWin ? '允许' : '不允许'}</p>
              <p><span className="text-slate-500">参与人数：</span>{participants.length} 人</p>
            </CardContent>
          </Card>
          <Button className="w-full" onClick={() => router.push(`/activities/${id}/lottery`)} disabled={activity.rounds.length === 0}>
            <Play className="h-4 w-4 mr-2" />开始抽奖
          </Button>
          <Button variant="outline" className="w-full" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />导出中奖结果
          </Button>
        </div>
      </div>

      {/* Participants Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            参与人员 ({filteredParticipants.length})
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索姓名、工号、部门"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? '导入中...' : '追加导入'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-center text-slate-500 py-8">暂无参与人员</p>
          ) : (
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>工号</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead className="w-16">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.employeeId || '-'}</TableCell>
                      <TableCell>{p.department || '-'}</TableCell>
                      <TableCell>{p.email || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteParticipant(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingRound} onOpenChange={() => setEditingRound(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑轮次</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>奖品名称</Label><Input value={roundForm.prizeName} onChange={e => setRoundForm({...roundForm, prizeName: e.target.value})} /></div>
            <div><Label>奖品描述</Label><Input value={roundForm.prizeDescription} onChange={e => setRoundForm({...roundForm, prizeDescription: e.target.value})} /></div>
            <div><Label>中奖人数</Label><Input type="number" value={roundForm.winnerCount} onChange={e => setRoundForm({...roundForm, winnerCount: Number(e.target.value)})} min={1} /></div>
            <div><Label>抽奖模式</Label>
              <Select value={roundForm.lotteryMode} onValueChange={v => setRoundForm({...roundForm, lotteryMode: v as LotteryMode})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LOTTERY_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>动画时长（秒）</Label><Input type="number" value={roundForm.animationDurationMs / 1000} onChange={e => setRoundForm({...roundForm, animationDurationMs: Number(e.target.value) * 1000})} min={10} max={300} /></div>
            <Button onClick={handleUpdateRound} className="w-full">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
