import { useState } from 'react';
import { format } from 'date-fns';
import {
  MessageSquare,
  Star,
  Filter,
  ThumbsDown,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  BarChart3,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useAdminFeedback,
  UserFeedback,
  FeedbackType,
  FeedbackTargetType,
  FeedbackStatus,
  FeedbackFilters,
} from '@/hooks/useFeedback';

const feedbackTypeLabels: Record<FeedbackType, string> = {
  price_accuracy: 'मूल्य सटीकता',
  guide_usefulness: 'गाइड उपयोगिता',
  app_experience: 'एप अनुभव',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
};

const targetTypeLabels: Record<FeedbackTargetType, string> = {
  market_price: 'बजार मूल्य',
  guide: 'गाइड',
  screen: 'स्क्रिन',
  feature: 'फिचर',
  app: 'एप',
  other: 'अन्य',
};

const statusConfig: Record<FeedbackStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  seen: { label: 'Seen', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-purple-100 text-purple-800' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  dismissed: { label: 'Dismissed', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
};

export function FeedbackManager() {
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { feedback, isLoading, stats, updateStatus, deleteFeedback } = useAdminFeedback(filters);

  const handleStatusChange = (id: string, status: FeedbackStatus) => {
    updateStatus({ id, status, admin_notes: adminNotes });
    setSelectedFeedback(null);
    setAdminNotes('');
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3.5 w-3.5',
              i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">कुल प्रतिक्रिया</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">औसत रेटिङ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.lowRatings}</p>
                  <p className="text-xs text-muted-foreground">कम रेटिङ (≤2)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            फिल्टर
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">प्रकार</Label>
              <Select
                value={filters.feedback_type || '_all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, feedback_type: v === '_all' ? undefined : (v as FeedbackType) })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="सबै" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">सबै</SelectItem>
                  {Object.entries(feedbackTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Target</Label>
              <Select
                value={filters.target_type || '_all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, target_type: v === '_all' ? undefined : (v as FeedbackTargetType) })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="सबै" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">सबै</SelectItem>
                  {Object.entries(targetTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status || '_all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, status: v === '_all' ? undefined : (v as FeedbackStatus) })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="सबै" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">सबै</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Min Rating</Label>
              <Select
                value={filters.min_rating?.toString() || '_all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, min_rating: v === '_all' ? undefined : parseInt(v) })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="सबै" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">सबै</SelectItem>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      {r}+ ★
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            User Feedback ({feedback.length})
          </CardTitle>
          <CardDescription>प्रयोगकर्ताहरूको प्रतिक्रिया र सुझाव</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              कुनै प्रतिक्रिया छैन
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">मिति</TableHead>
                    <TableHead>प्रकार</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="max-w-[200px]">Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((f) => {
                    const status = statusConfig[f.status];
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="text-xs">
                          {format(new Date(f.created_at), 'MM/dd HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {feedbackTypeLabels[f.feedback_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {targetTypeLabels[f.target_type]}
                          {f.target_id && (
                            <span className="text-muted-foreground ml-1">
                              #{f.target_id.slice(0, 6)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{renderRating(f.rating)}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-xs truncate">{f.comment_text || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs gap-1', status.color)}>
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedFeedback(f);
                                setAdminNotes(f.admin_notes || '');
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteFeedback(f.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p>{feedbackTypeLabels[selectedFeedback.feedback_type]}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Target</Label>
                  <p>
                    {targetTypeLabels[selectedFeedback.target_type]}
                    {selectedFeedback.target_id && ` (${selectedFeedback.target_id})`}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rating</Label>
                  {renderRating(selectedFeedback.rating)}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p>{format(new Date(selectedFeedback.created_at), 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>

              {selectedFeedback.comment_text && (
                <div>
                  <Label className="text-xs text-muted-foreground">Comment</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {selectedFeedback.comment_text}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={selectedFeedback.status === key ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => handleStatusChange(selectedFeedback.id, key as FeedbackStatus)}
                    >
                      <config.icon className="h-3.5 w-3.5" />
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
