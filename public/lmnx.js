// Lumnix First-Party Pixel — lmnx.js
// Usage: <script src="https://lumnix-ai.vercel.app/lmnx.js" data-workspace="YOUR_WORKSPACE_ID"></script>
(function() {
  'use strict';
  var ENDPOINT = 'https://lumnix-ai.vercel.app/api/pixel/collect';
  var script = document.currentScript;
  var workspaceId = script && script.getAttribute('data-workspace');
  if (!workspaceId) return;

  // Visitor ID (persisted in cookie)
  function getVisitorId() {
    var match = document.cookie.match(/lmnx_vid=([^;]+)/);
    if (match) return match[1];
    var id = 'lmnx_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    document.cookie = 'lmnx_vid=' + id + ';path=/;max-age=31536000;SameSite=Lax';
    return id;
  }

  // Session ID (persisted in sessionStorage)
  function getSessionId() {
    var sid = sessionStorage.getItem('lmnx_sid');
    if (sid) return sid;
    sid = 'lmnxs_' + Math.random().toString(36).substr(2, 8);
    sessionStorage.setItem('lmnx_sid', sid);
    return sid;
  }

  // Parse UTM params from URL
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
    };
  }

  // Device detection
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  // Send event
  function send(eventType, extra) {
    var utm = getUtmParams();
    var payload = {
      workspace_id: workspaceId,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      event_type: eventType,
      page_url: window.location.href,
      referrer: document.referrer || '',
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      device_type: getDeviceType(),
      browser: navigator.userAgent.split(' ').pop() || '',
    };
    if (extra) {
      for (var k in extra) payload[k] = extra[k];
    }
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // Auto-track pageview
  send('pageview');

  // Track SPA navigations
  var pushState = history.pushState;
  history.pushState = function() {
    pushState.apply(history, arguments);
    setTimeout(function() { send('pageview'); }, 100);
  };
  window.addEventListener('popstate', function() {
    setTimeout(function() { send('pageview'); }, 100);
  });

  // Expose global API for custom events and conversions
  window.lmnx = {
    track: function(eventType, data) { send(eventType, data); },
    conversion: function(type, value, meta) {
      send('conversion', {
        conversion_type: type || 'purchase',
        conversion_value: value || 0,
        metadata: meta || {},
      });
    },
  };
})();
