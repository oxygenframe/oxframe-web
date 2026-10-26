import {renderVideo} from '@revideo/renderer';

await renderVideo({
  projectFile: './src/project.ts',
  variables: {name: 'Grace'},
  settings: {outFile: 'welcome.mp4', puppeteer: {args: ['--no-sandbox']}},
});
