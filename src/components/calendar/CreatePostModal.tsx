'use client';

import { useState, useEffect } from 'react';
import type { UserRole } from '@/lib/auth/permissions';
import { canPublishDirectly } from '@/lib/auth/permissions';
import PostWizard from '@/components/PostWizard';
import GeneratedPostReview from '@/components/GeneratedPostReview';
import EventCampaignReview from '@/components/EventCampaignReview';

const ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d';

interface CreatePostModalProps {
  date: Date;
  userRole?: UserRole | null;
  onClose: () => void;
  onSave: (data: {
    caption: string;
    hashtags: string;
    scheduled_at: string;
    platforms: string[];
    post_type: string;
    submit_for_review?: boolean;
    publish_directly?: boolean;
  }) => Promise<void>;
  onSaveCampaign?: (posts: any[]) => Promise<void>;
}

const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'GBP'];
const POST_TYPES = [
  'Educational',
  'Before/After',
  'Promotional',
  'Behind Scenes',
  'Trending/Viral',
  'Testimonial',
  'Seasonal',
  'Event',
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];

const POST_TYPE_TIMES: Record<string, { hour: number; minute: string; ampm: string }> = {
  'Educational':    { hour: 11, minute: '00', ampm: 'AM' },
  'Promotional':    { hour: 12, minute: '00', ampm: 'PM' },
  'Before/After':   { hour: 6,  minute: '00', ampm: 'PM' },
  'Behind Scenes':  { hour: 9,  minute: '00', ampm: 'AM' },
  'Trending/Viral': { hour: 9,  minute: '00', ampm: 'AM' },
  'Testimonial':    { hour: 11, minute: '00', ampm: 'AM' },
  'Seasonal':       { hour: 11, minute: '00', ampm: 'AM' },
  'Event':          { hour: 10, minute: '00', ampm: 'AM' },
};

const inputClass = 'w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-[#0F172A] mb-1';

export default function CreatePostModal({ date, userRole, onClose, onSave, onSaveCampaign }: CreatePostModalProps) {
  const isPublisher = canPublishDirectly(userRole ?? null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [hour, setHour] = useState(11);
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [postType, setPostType] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);

  useEffect(function() {
    fetch('/api/services?org_id=' + ORG_ID)
      .then(function(r) { return r.json(); })
      .then(function(d) { setServices(d.services || d || []); })
      .catch(function(e) { console.error('Failed to load services:', e); });

    fetch('/api/practitioners?org_id=' + ORG_ID)
      .then(function(r) { return r.json(); })
      .then(function(d) { setPractitioners(d.practitioners || d || []); })
      .catch(function(e) { console.error('Failed to load practitioners:', e); });
  }, []);

  const handlePostTypeChange = (type: string) => {
    setPostType(type);
    const defaults = POST_TYPE_TIMES[type];
    if (defaults) {
      setHour(defaults.hour);
      setMinute(defaults.minute);
      setAmpm(defaults.ampm);
    }
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const buildScheduledAt = () => {
    let h24 = hour % 12;
    if (ampm === 'PM') h24 += 12;
    const timeStr = String(h24).padStart(2, '0') + ':' + minute;
    const dateStr = date.toISOString().split('T')[0];
    return new Date(dateStr + 'T' + timeStr + ':00').toISOString();
  };

  const handleWizardComplete = (result: any) => {
    setShowWizard(false);
    if (result.type === 'campaign') {
      setCampaignData(result);
      setShowCampaign(true);
    } else {
      setGeneratedData(result);
      setShowReview(true);
    }
  };

  const handleUseDraft = (fullCaption: string, tags: string[]) => {
    setCaption(fullCaption);
    setHashtags(tags.join(' '));
    setShowReview(false);
  };

  const handleCampaignApprove = async (selectedPosts: any[]) => {
    setShowCampaign(false);
    if (onSaveCampaign) {
      await onSaveCampaign(selectedPosts);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ caption, hashtags, scheduled_at: buildScheduledAt(), platforms, post_type: postType });
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ caption, hashtags, scheduled_at: buildScheduledAt(), platforms, post_type: postType, submit_for_review: true });
      onClose();
    } catch (error) {
      console.error('Error saving and submitting post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await onSave({ caption, hashtags, scheduled_at: buildScheduledAt(), platforms, post_type: postType, publish_directly: true });
      onClose();
    } catch (error) {
      console.error('Error publishing post:', error);
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {showWizard && (
        <div style={{position: 'fixed', inset: 0, zIndex: 9999}}>
        <PostWizard
          services={services}
          practitioners={practitioners}
          onComplete={handleWizardComplete}
          onCancel={function() { setShowWizard(false); }}
        />
        </div>
      )}

      {showReview && generatedData && (
        <div style={{position: 'fixed', inset: 0, zIndex: 9999}}>
        <GeneratedPostReview
          generated={generatedData.generated}
          platforms={generatedData.platforms}
          format={generatedData.format}
          post_type={generatedData.post_type}
          onUse={handleUseDraft}
          onRegenerate={function() { setShowReview(false); setShowWizard(true); }}
          onCancel={function() { setShowReview(false); }}
        />
        </div>
      )}

      {showCampaign && campaignData && (
        <div style={{position: 'fixed', inset: 0, zIndex: 9999}}>
        <EventCampaignReview
          event_name={campaignData.event_name}
          event_date={campaignData.event_date}
          campaign_posts={campaignData.campaign?.campaign_posts || []}
          onApprove={handleCampaignApprove}
          onCancel={function() { setShowCampaign(false); }}
        />
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-base font-semibold text-[#0F172A]">New Draft Post</h3>
            <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B] text-xl leading-none transition">
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <p className="text-sm text-[#64748B]">{dateLabel}</p>

            <button
              type="button"
              onClick={function() { setShowWizard(true); }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              <span>Generate with AI</span>
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[#E2E8F0]"></div>
              <span className="flex-shrink mx-3 text-xs text-[#94A3B8]">or write manually</span>
              <div className="flex-grow border-t border-[#E2E8F0]"></div>
            </div>

            <div>
              <label className={labelClass}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className={inputClass + ' resize-none'}
                placeholder="Write your post caption..."
              />
            </div>

            <div>
              <label className={labelClass}>Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className={inputClass}
                placeholder="#medspa #beauty #skincare"
              />
            </div>

            <div>
              <label className={labelClass}>Post Type</label>
              <select
                value={postType}
                onChange={(e) => handlePostTypeChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Select post type</option>
                {POST_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Scheduled Time</label>
              <div className="flex gap-2">
                <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className={'flex-1 ' + inputClass}>
                  {HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className={'flex-1 ' + inputClass}>
                  {MINUTES.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
                <select value={ampm} onChange={(e) => setAmpm(e.target.value)} className={'flex-1 ' + inputClass}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Platforms</label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <span className="text-sm text-[#0F172A]">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8F9FB] text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:bg-[#F8F9FB] text-sm font-medium disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              {isPublisher ? (
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving}
                    className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
                  >
                    {saving ? 'Publishing...' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndSubmit}
                    disabled={saving}
                    className="text-xs text-[#64748B] hover:text-[#4F46E5] transition"
                  >
                    Submit for Review instead
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAndSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
                >
                  {saving ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
