use oxframe::prelude::*;

#[oxframe::scene]
pub async fn hello(view: View) {
    let title = view.add(Txt::new().text("Release 2.0").h1().opacity(0.0).y(-20.0));
    // Runs alongside the rest of the scene, like an element that is already mounted.
    spawn(async move {
        all((
            title.opacity().to(1.0, 0.66),
            title.y().to(-80.0, 0.8).ease(presets::OUT_BACK),
        ))
        .await;
    });
    wait_for(1.0).await; // <Sequence from={30}> at 30 fps

    let percent = Signal::new(0.0);
    let line = view.add(Txt::new().body().y(40.0));
    line.text().bind({
        let percent = percent.clone();
        move || format!("{:.0}% faster builds", percent.get())
    });
    percent.to(100.0, 2.0).await;
    wait_for(1.0).await;
}

pub fn project() -> Project {
    Project::new("hello").size(1920, 1080).fps(30).scene(hello())
}
