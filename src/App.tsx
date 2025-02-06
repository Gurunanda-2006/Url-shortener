import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Copy, ExternalLink, Github, Link as LinkIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

interface UrlEntry {
  short_url: string;
  long_url: string;
  created_at: string;
  clicks: number;
}

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<UrlEntry[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const path = window.location.pathname.slice(1);
    if (path) {
      handleRedirect(path);
    } else {
      loadHistory();
    }
  }, []);

  const handleRedirect = async (path: string) => {
    try {
      // Query the database for the short URL
      const { data, error } = await supabase
        .from('urls')
        .select('long_url')
        .eq('short_url', path)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - invalid short URL
          setNotFound(true);
          return;
        }
        throw error;
      }

      if (data) {
        // Increment the click count
        await supabase
          .from('urls')
          .update({ clicks: supabase.sql`clicks + 1` })
          .eq('short_url', path);

        // Redirect to the long URL
        window.location.href = data.long_url;
      }
    } catch (error) {
      console.error('Error during redirect:', error);
      setNotFound(true);
    }
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setHistory(data);
    }
  };

  const generateShortUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setIsLoading(true);
    try {
      const shortCode = nanoid(8);
      const { error } = await supabase.from('urls').insert({
        short_url: shortCode,
        long_url: longUrl,
        user_ip: 'anonymous'
      });

      if (error) throw error;

      toast.success('URL shortened successfully!');
      setLongUrl('');
      loadHistory();
    } catch (error) {
      toast.error('Failed to shorten URL');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (shortUrl: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/${shortUrl}`);
    toast.success('Copied to clipboard!');
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - URL Not Found</h1>
          <p className="text-gray-400 mb-8">The shortened URL you're looking for doesn't exist.</p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors inline-block"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                URL Shortener
              </h1>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* URL Input Form */}
          <form onSubmit={generateShortUrl} className="mb-12">
            <div className="flex gap-4">
              <input
                type="url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="Enter your long URL here..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Shortening...' : 'Shorten URL'}
              </button>
            </div>
          </form>

          {/* History Section */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Recent URLs</h2>
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.short_url}
                  className="bg-gray-900 rounded-lg p-4 hover:bg-gray-850 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <a
                      href={entry.long_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 truncate max-w-md flex items-center gap-2"
                    >
                      {entry.long_url}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <span className="text-gray-400 text-sm">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-mono">
                        {window.location.origin}/{entry.short_url}
                      </span>
                      <button
                        onClick={() => copyToClipboard(entry.short_url)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {entry.clicks} clicks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;