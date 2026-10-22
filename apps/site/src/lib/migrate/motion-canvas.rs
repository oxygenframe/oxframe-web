use oxframe::prelude::*;

#[oxframe::scene]
pub async fn hello(view: View) {
    let circle = view.add(Circle::new().size(320.0).fill(color!("#e13238")).x(-300.0));
    let count = Signal::new(0.0);
    let label = view.add(Txt::new().font_size(80.0).y(300.0));
    label.text().bind({
        let count = count.clone();
        move || format!("{:.0}", count.get())
    });

    circle.x().to(300.0, 1.0).await;
    all((
        circle.fill().to(color!("#68abdf"), 1.0),
        circle.scale().to(Vec2::new(1.5, 1.5), 1.0),
    ))
    .await;
    count.to(100.0, 2.0).await;
    wait_for(0.5).await;
}

pub fn project() -> Project {
    Project::new("hello").scene(hello())
}
