use oxframe::prelude::*;

#[oxframe::scene]
async fn intro(view: View) {
    let square = view.add(Rect::new().size(200.0).x(-300.0).fill(color!("#e13238")));
    all((
        square.x().to(300.0, 1.0),
        square.radius().to(100.0, 1.0),
        square.fill().to(color!("#68abdf"), 1.0),
    ))
    .await;
    wait_until("title").await;
    let t = view.add(Txt::new().text("").font_size(96.0).y(220.0));
    t.text().to("Hello from wasm".into(), 1.0).ease(presets::LINEAR).await;
    wait_for(1.0).await;
}

pub fn project() -> Project {
    Project::new("playground").scene(intro())
}
