"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Send, 
  CornerDownRight, 
  User, 
  Clock, 
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: number
  user_id: number
  username: string
  question_id: number
  comment_text: string
  parent_comment_id: number | null
  created_at: string
  replies: Comment[]
}

function CommentItem({ 
  comment, 
  questionId, 
  onReplySuccess 
}: { 
  comment: Comment; 
  questionId: number; 
  onReplySuccess: () => void 
}) {
  const { user } = useAuth()
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const handleReply = async () => {
    if (!replyText.trim() || !user) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          question_id: questionId,
          comment_text: replyText.trim(),
          parent_comment_id: comment.id
        })
      })
      if (res.ok) {
        setReplyText("")
        setIsReplying(false)
        onReplySuccess()
      }
    } catch (error) {
      console.error("Failed to post reply:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground">{comment.username}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {comment.comment_text}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              Reply
            </button>
            {comment.replies.length > 0 && (
              <button 
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea 
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyText.trim()}>
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                  Post Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReplies && comment.replies.length > 0 && (
        <div className="ml-11 flex flex-col gap-4 border-l-2 border-border/30 pl-4 mt-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-foreground">{reply.username}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {reply.comment_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ questionId }: { questionId: number }) {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const apiUrl = `/api/comments?question_id=${questionId}`
  const { data: comments, isLoading, error } = useSWR<Comment[]>(apiUrl)

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          question_id: questionId,
          comment_text: newComment.trim()
        })
      })
      if (res.ok) {
        setNewComment("")
        mutate(apiUrl)
      }
    } catch (error) {
      console.error("Failed to post comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-secondary" />
        <h3 className="text-lg font-bold text-foreground">Discussion</h3>
        <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          {isLoading ? "..." : (comments?.length || 0) + (comments?.reduce((acc, c) => acc + c.replies.length, 0) || 0)}
        </span>
      </div>

      {user ? (
        <div className="mb-8 space-y-3">
          <Textarea 
            placeholder="Share your thoughts or ask a question about this topic..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] border-border focus:ring-secondary/20"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handlePostComment} 
              disabled={isSubmitting || !newComment.trim()}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-muted/40 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Please sign in to join the discussion.</p>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-destructive py-4">Failed to load comments.</p>
        ) : comments && comments.length > 0 ? (
          <div className="divide-y divide-border/50">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                questionId={questionId}
                onReplySuccess={() => mutate(apiUrl)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  )
}
