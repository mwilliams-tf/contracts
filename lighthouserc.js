/** @type {import('@lhci/cli').Config} */
export default {
  ci: {
    collect: {
      numberOfRuns: 1,
      // TODO: Adjust for your project's dev server
      // Examples:
      //   Angular:  'npx ng serve --port 9222'
      //   Vite:     'npx vite --port 9222'
      //   Next.js:  'npx next dev -p 9222'
      //   Python:   'uvicorn main:app --port 9222'
      //   Static:   'npx serve dist -l 9222'
      startServerCommand: 'npm run dev -- --port 9222',
      startServerReadyPattern: '(Local|localhost).+9222',
      startServerReadyTimeout: 60000,
      url: ['http://localhost:9222/'],
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-gpu',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
