use oxframe::prelude::*;

fn circle(r: f64) -> BezPath {
    use oxframe::core::kurbo::Shape;
    oxframe::core::kurbo::Circle::new((0.0, 0.0), r).to_path(0.1)
}

#[oxframe::scene]
pub async fn hello(view: View) {
    let shape = view.add(
        Path::new()
            .data(circle(150.0))
            .fill(Color::TRANSPARENT)
            .stroke(color!("#e13238"))
            .line_width(6.0)
            .end(0.0),
    );
    shape.draw_on().await; // Create(circle)
    all((
        // Transform(circle, Square(...)): any path morphs into any other
        shape.data().to(BezPath::from_svg("M-150 -150 H150 V150 H-150 Z").unwrap(), 1.0),
        shape.stroke().to(color!("#68abdf"), 1.0),
    ))
    .await;
    shape.x().to(300.0, 1.0).await; // circle.animate.shift(RIGHT * 2)
    wait_for(1.0).await; // self.wait()
}

#[oxframe::scene]
pub async fn graph(view: View) {
    let axes = view.add(
        Axes::new()
            .x_range(-3.0..3.0)
            .y_range(-1.5..1.5)
            .width(pct(80))
            .height(pct(60)),
    );
    let sine = axes.plot(|x| x.sin()).stroke(Accent);
    sine.draw_on().await; // Create(sine)
    let x = Signal::new(-3.0); // ValueTracker(-3)
    axes.point_on(&sine, x.clone()); // the dot follows x, like always_redraw
    x.to(3.0, 2.0).await; // x.animate.set_value(3), run_time=2
    wait_for(0.5).await;
}

pub fn project() -> Project {
    Project::new("hello").scene(hello()).scene(graph())
}
