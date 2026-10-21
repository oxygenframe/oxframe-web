<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>15. Vectors and matrices</h1>
<p class="lead">
  An arrow on a set of axes, a matrix that stretches the whole plane, and the numbers shown beside
  it.
</p>

<LiveExample name="learn_15_matrices" open />

<h2>A vector is an arrow on axes</h2>
<p>
  <code>axes.vector(1.0, 2.0)</code> draws an arrow from the origin to the data point (1, 2). It is
  a line, so <code>.draw_on()</code> works as in lesson 9, and its tip is two signals:
  <code>v.to(-1.0, 1.0, 1.0)</code> moves it.
</p>

<h2>A matrix moves the plane</h2>
<p>
  <code>axes.apply_matrix([[2.0, 0.0], [0.0, 1.0]], 1.5)</code> stretches x by 2. The grid bends and the
  vector follows, because both are drawn through the matrix every frame — the same idea as the ranges
  in lesson 14.
</p>

<h2>Showing the numbers</h2>
<p>
  <code>Matrix::new([[2, 0], [0, 1]])</code> draws the values in brackets. Each cell is a text node, so
  you can change or color it as the scene goes.
</p>

<Try>
  <ul>
    <li>A shear: <code>axes.apply_matrix([[1.0, 1.0], [0.0, 1.0]], 1.5)</code>.</li>
    <li>Color a cell: <code>m.cell(0, 0).fill().to(Accent, 0.3).await</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li><code>axes.vector</code> draws an arrow; its tip is signals.</li>
    <li><code>apply_matrix</code> maps the plane, and everything on the axes follows.</li>
    <li>
      <a href="/docs/0.17.0/matrices">Matrices, vectors and tables</a> has row and column frames, matrix
      multiplication step by step, and tables.
    </li>
  </ul>
</Recap>

<h2>You made it</h2>
<p>
  That is the whole core of oxframe. From here, browse <a href="/docs/0.17.0/nodes">all nodes</a>
  and
  <a href="/docs/0.17.0/effects">effects</a>, open the
  <a href="/playground?v=0.17.0&ex=ocean">ocean scene</a> to see everything working together, or
  read
  <a href="/docs/0.17.0/how-it-works">how oxframe works</a> inside.
</p>
