use oxframe::prelude::*;

#[oxframe::scene]
pub async fn hello(view: View) {
    // A rich-text clip, left-aligned, white, 32 px; it fades in and out.
    let title = view.add(
        Txt::new()
            .text("HELLO WORLD")
            .font_size(32.0)
            .fill(Color::WHITE)
            .to_edge(Edge::Left)
            .opacity(0.0),
    );
    title.fade_in().await;
    // Shotstack holds the frame still under its music. Without a soundtrack,
    // oxframe check calls four still seconds dead time, so the title drifts.
    title.scale().to(Vec2::new(1.08, 1.08), 4.0).ease(presets::LINEAR).await;
    title.fade_out().await;
}

pub fn project() -> Project {
    // The audio track becomes Audio::track("moment.mp3").master_fade(0.0, 1.0) with
    // the file next to the project; the playground has no files, so it is left out.
    Project::new("hello").size(1024, 576).scene(hello())
}
