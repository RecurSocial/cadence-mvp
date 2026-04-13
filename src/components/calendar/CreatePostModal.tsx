'use client';

import { useState } from 'react';

interface CreatePostModalProps {
  date: Date;
  onClose: () => void;
  onSave: (data: {
    caption: string;
    hashtags: string;
    scheduled_at: string;
    platforms: string[];
    post_type: string;
    submit_for_review?: boolean;
  }) => Promise<void>;
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
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];

const POST_TYPE_TIMES: Record<string, { hour: number; minute: string; ampm: string }> = {
  'Educational':        { hour: 11, minute: '00', ampm: 'AM' },
  'Promotional':        { hour: 12, minute: '00', ampm: 'PM' },
  'Before/After':       { hour: 6,  minute: '00', ampm: 'PM' },
  'Behind Scenes':  { hour: 9,  minute: '00', ampm: 'AM' },
  'Trending/Viral':     { hour: 9,  minute: '00', ampm: 'AM' },
  'Testimonial':        { hour: 11, minute: '00', ampm: 'AM' },
  'Seasonal':           { hour: 11, minute: '00', ampm: 'AM' },
};

const inputClass = 'w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-[#0F172A] mb-1';

export default function CreatePostModal({ date, onClose, onSave }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [hour, setHour] = useState(11);
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [postType, setPostType] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
    const timeStr = `${String(h24).padStart(2, '0')}:${minute}`;
    const dateStr = date.toISOString().split('T')[0];
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
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
      console.error('Error saving & submitting post:', error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-semibold text-[#0F172A]">New Draft Post</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B] text-xl leading-none transition">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-[#64748B]">{dateLabel}</p>

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
            <button
              type="button"
              onClick={handleSaveAndSubmit}
              disabled={saving}
              className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
            >
              {saving ? 'Submitting...' : 'Save & Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
