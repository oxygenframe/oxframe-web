<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Matrices, vectors and tables</h1>
<p class="lead">
  Matrices with cells you can point at, vectors on axes, linear maps that bend the grid, and tables
  whose rows slide into place.
</p>

<LiveExample name="matrix_multiply" />

<h2>Matrix</h2>
<pre><code
    >{`let a = view.add(Matrix::new([[1, 2], [3, 4]]).font_size(64.0));
let row = a.row_frame(0);
row.fade_in().await;
a.cell(0, 1).fill().to(Accent, 0.3).await;`}</code
  ></pre>
<p>
  <code>Matrix::new</code> takes rows of numbers, <code>&str</code> or anything that prints, and
  draws them in square brackets. Every cell is a <code>Txt</code>: <code>a.cell(r, c)</code>,
  <code>a.row(r)</code> and <code>a.column(c)</code> give them, so <code>.text().set(..)</code>
  changes a value and <code>.fill()</code> colors it. <code>row_frame</code>,
  <code>column_frame</code> and <code>cell_frame</code> add a rounded outline, hidden until you fade
  it in. <code>.cell_width(px)</code> keeps room for values that will be longer than the first ones,
  such as a result filled in step by step; <code>.font_size(px)</code>,
  <code>.column_gap(px)</code> and <code>.row_gap(px)</code> set the rest.
</p>

<h2>Vectors and linear maps</h2>

<LiveExample name="linear_map" />

<pre><code
    >{`let axes = view.add(Axes::new().x_range(-4.0..4.0).y_range(-3.0..3.0));
let v = axes.vector(2.0, 1.0);
v.label("v");
axes.apply_matrix([[1.0, 1.0], [0.0, 1.0]], 1.5).await; // a shear
v.to(-1.0, 2.0, 1.0).await;
axes.matrix().to(Mat2::IDENTITY, 1.0).await;`}</code
  ></pre>
<p>
  <code>axes.vector(x, y)</code> draws an arrow from the origin. Its tip is two signals,
  <code>v.x()</code> and <code>v.y()</code>, and <code>v.to(x, y, seconds)</code> moves both;
  <code>.label("v")</code> keeps a label past the tip, off to the side, so
  <code>axes.vector(..).label("i")</code> along an axis does not sit on the axis line.
</p>
<p>
  <code>axes.apply_matrix(m, seconds)</code> maps the plane through a 2 × 2 matrix, written row by
  row, on top of what was applied before. A transformed grid is drawn over the original one, and
  plots, series, vectors and nodes placed with <code>axes.place</code> move with it. The matrix
  itself is
  <code>axes.matrix()</code>, a <code>Mat2</code> signal that animates entry by entry; set it back
  to
  <code>Mat2::IDENTITY</code> to undo. <code>Mat2::after</code> multiplies two matrices and
  <code>Mat2::det</code> gives the determinant. Ticks and labels stay where they were, and placed nodes
  keep their own shape.
</p>

<h2>Table</h2>

<LiveExample name="table_sort" />

<pre><code
    >{`let table = view.add(
    Table::new(["Renderer", "Frame"])
        .row(["skia", "12 ms"])
        .row(["vello", "4 ms"]),
);
table.insert_row(1, ["wgpu", "3 ms"]).await;
table.sort_by_column(1, 0.8).await;
table.row(0).background().fade_in().await;
table.remove_row(2).await;`}</code
  ></pre>
<p>
  <code>Table::new</code> takes the column titles and <code>.row(..)</code> adds rows. Columns fit
  their widest value; <code>.widths([..])</code> sets them when rows added later are wider, and
  <code>.font_size(px)</code> with <code>.row_height(px)</code> sizes the text.
</p>
<p>
  The rows are a list you change while the scene runs. <code>insert_row</code> and
  <code>push_row</code> slide the rows below down and fade the new one in;
  <code>remove_row</code> fades one out and closes the gap. <code>sort_by_column</code> moves every
  row to its sorted place, comparing cells that start with a number (<code>"12 ms"</code>) as
  numbers;
  <code>sort_by</code> takes your own comparison. <code>table.row(i)</code> is a
  <code>TableRow</code> in the current order, with its cells and a hidden background for highlights.
</p>
