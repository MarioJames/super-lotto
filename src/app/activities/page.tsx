'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Play, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Activity, Participant } from '@/lib/types';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowMultiWin: false,
    animationDurationMs: 60000,
  });

  useEffect(() => {
    fetchActivities();
    fetchParticipants();
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

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.success) setParticipants(data.data);
    } catch {
      console.error('获取参与人员失败');
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入活动名称');
      return;
    }
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, participantIds: selectedParticipants }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('创建成功');
        setIsCreateDialogOpen(false);
        setFormData({ name: '', description: '', allowMultiWin: false, animationDurationMs: 60000 });
        setSelectedParticipants([]);
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

  const toggleParticipant = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAllParticipants = () => {
    setSelectedParticipants(participants.map(p => p.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">抽奖活动</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />创建活动</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>创建抽奖活动</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>活动名称 *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如：年会抽奖" /></div>
              <div><Label>活动描述</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="活动说明" /></div>
              <div className="flex items-center justify-between">
                <div><Label>允许多次中奖</Label><p className="text-sm text-slate-500">开启后同一人可在不同轮次中奖</p></div>
                <Switch checked={formData.allowMultiWin} onCheckedChange={v => setFormData({...formData, allowMultiWin: v})} />
              </div>
              <div><Label>动画时长（秒）</Label><Input type="number" value={formData.animationDurationMs / 1000} onChange={e => setFormData({...formData, animationDurationMs: Number(e.target.value) * 1000})} min={10} max={300} /></div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>选择参与人员 ({selectedParticipants.length}/{participants.length})</Label>
                  <Button variant="outline" size="sm" onClick={selectAllParticipants}>全选</Button>
                </div>
                <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                  {participants.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">暂无参与人员，请先添加</p>
                  ) : (
                    participants.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input type="checkbox" checked={selectedParticipants.includes(p.id)} onChange={() => toggleParticipant(p.id)} className="rounded" />
                        <span>{p.name}</span>
                        <span className="text-slate-400 text-sm">({p.department})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">创建活动</Button>
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
                  <p>动画时长：{activity.animationDurationMs / 1000} 秒</p>
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
