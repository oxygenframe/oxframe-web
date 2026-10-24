//! In the style of 3Blue1Brown's "Essence of linear algebra": a matrix is
//! where the basis vectors land, and every other vector follows them.

use oxframe::prelude::*;

#[oxframe::scene]
pub async fn essence(view: View) {
    let (green, red, yellow) = (color!("#83C167"), color!("#FC6255"), color!("#FFFF00"));
    let title = view.add(
        Txt::new()
            .text("Where do î and ĵ land?")
            .font_size(44.0)
            .fill(Color::WHITE)
            .to_edge(Edge::Top)
            .opacity(0.0),
    );
    let axes = view.add(
        Axes::new()
            .x_range(-6.0..6.0)
            .y_range(-3.5..3.5)
            .width(1200.0)
            .height(700.0)
            .y(40.0),
    );
    let i = axes.vector(1.0, 0.0).stroke(green);
    i.label("î");
    let j = axes.vector(0.0, 1.0).stroke(red);
    j.label("ĵ");
    title.fade_in().await;
    wait_for(0.6).await;

    // v = -1 î + 2 ĵ: written in the basis before the plane moves.
    let v = axes.vector(-1.0, 2.0).stroke(yellow);
    v.label("v");
    let m = view.add(
        Matrix::new([[1, 0], [0, 1]])
            .font_size(48.0)
            .cell_width(56.0)
            .x(720.0)
            .y(-260.0),
    );
    wait_for(0.8).await;

    // î lands on (1, -2) and ĵ on (3, 0): those are the matrix's columns.
    m.cell(1, 0).text().set("-2");
    m.cell(0, 1).text().set("3");
    m.cell(1, 1).text().set("0");
    axes.apply_matrix([[1.0, 3.0], [-2.0, 0.0]], 2.5).await;
    title.text().set("v lands on -1·(1, -2) + 2·(3, 0) = (5, 2)");
    wait_for(1.5).await;
}

pub fn project() -> Project {
    Project::new("essence").background(Color::BLACK).scene(essence())
}
