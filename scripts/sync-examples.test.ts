import { describe, expect, it } from 'bun:test';
import { sceneSource } from './sync-examples.ts';

describe('sceneSource', () => {
  it('drops a test module and keeps the scene', () => {
    const source =
      'pub fn project() -> Project { Project::new("x") }\n\n#[cfg(test)]\nmod tests {}\n';
    expect(sceneSource(source)).toBe('pub fn project() -> Project { Project::new("x") }\n');
    expect(sceneSource(source)).not.toContain('cfg(test)');
  });

  it('leaves a scene without tests unchanged', () => {
    const source = 'pub fn project() -> Project { Project::new("x") }\n';
    expect(sceneSource(source)).toBe(source);
  });
});
