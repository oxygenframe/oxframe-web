//! One link preview card (1200×630): the page's section and title, with two
//! waves along the bottom. scripts/og-images.ts sets OG_SECTION and
//! OG_TITLE and takes the frame at 1 s with `render --at 1 --out card.png`.

use oxframe::prelude::*;

const W: f64 = 1200.0;
const H: f64 = 630.0;
/// The left edge of the safe area (64 px in), where `to_edge(Edge::Left)` puts text.
const LEFT: f64 = -W / 2.0 + 64.0;

fn var(name: &str) -> String {
    std::env::var(name).unwrap_or_default()
}

/// A sine across the frame, `y` from the center, as line points.
fn wave(y: f64, amp: f64, cycles: f64, phase: f64) -> Vec<(f64, f64)> {
    (0..=120)
        .map(|i| {
            let t = f64::from(i) / 120.0;
            let x = -W / 2.0 + t * W;
            (x, y + amp * (std::f64::consts::TAU * cycles * t + phase).sin())
        })
        .collect()
}

#[oxframe::scene]
async fn card(view: View) {
    // The logo: the same square and circle as the site's header.
    let top = -H / 2.0 + 88.0;
    view.add(
        Rect::new()
            .size(32.0)
            .radius(7.0)
            .x(LEFT + 16.0)
            .y(top)
            .fill(color!("#e13238")),
    );
    view.add(
        Circle::new()
            .size(32.0)
            .x(LEFT + 42.0)
            .y(top)
            .fill(color!("#68abdf")),
    );
    view.add(
        Txt::new()
            .text("oxframe")
            .font_size(40.0)
            .weight(700.0)
            .x(LEFT + 72.0 + 80.0)
            .y(top),
    );
    // The section label over the title, centered between the logo and the
    // waves, so one line or three both sit in the middle.
    let block = view.add(
        Layout::new()
            .column()
            .gap(14.0)
            .align(LayoutAlign::Start)
            .to_edge(Edge::Left)
            .y(-6.0),
    );
    block.add(
        Txt::new()
            .text(var("OG_SECTION"))
            .font_size(30.0)
            .weight(600.0)
            .fill(Accent),
    );
    block.add(
        Txt::new()
            .text(var("OG_TITLE"))
            .font_size(64.0)
            .weight(800.0)
            .line_height(1.12)
            .max_width(1040.0),
    );
    view.add(
        Line::new()
            .points(wave(H / 2.0 - 92.0, 18.0, 1.6, 0.0))
            .stroke(color!("#68abdf"))
            .line_width(5.0),
    );
    view.add(
        Line::new()
            .points(wave(H / 2.0 - 70.0, 14.0, 2.1, 1.3))
            .stroke(color!("#e13238"))
            .line_width(4.0)
            .opacity(0.8),
    );
    wait_for(2.0).await;
}

fn main() {
    Project::new("og")
        .size(W as u32, H as u32)
        .write_meta(false)
        .scene(card())
        .main();
}
