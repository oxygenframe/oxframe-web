//! The oxframe.dev 404 page: two fours, and a magnifying glass looking for the zero.

use oxframe::prelude::*;

#[oxframe::scene]
pub async fn not_found(view: View) {
    let red = color!("#e13238");
    let blue = color!("#68abdf");
    let four = |x: f64| {
        view.add(
            Txt::new()
                .text("4")
                .font_size(360.0)
                .weight(800.0)
                .position((x, -900.0)),
        )
    };
    let fours = [four(-300.0), four(300.0)];
    // The glass is a ring and a handle in one group, so they move together.
    let glass = view.add(Group::new().position((-1300.0, 0.0)));
    let ring = glass.add(
        Circle::new()
            .size(190.0)
            .fill(blue.with_alpha(0.15))
            .stroke(blue)
            .line_width(28.0),
    );
    let handle = glass.add(
        Rect::new()
            .width(32.0)
            .height(130.0)
            .radius(16.0)
            .position((105.0, 105.0))
            .rotation(-45.0)
            .fill(red),
    );
    let caption = view.add(
        Txt::new()
            .text("")
            .font_size(46.0)
            .fill(Color::WHITE.with_alpha(0.65))
            .y(300.0),
    );

    // The fours drop in; the glass comes looking for the missing zero.
    stagger(0.12, &fours, |f| f.y().to(0.0, 0.7).ease(presets::OUT_BACK)).await;
    glass.x().to(-650.0, 0.6).await;
    glass.x().to(650.0, 1.1).await;
    glass.x().to(0.0, 0.7).ease(presets::OUT_BACK).await;

    // Found it: the handle goes and the ring stands up as the zero.
    all((
        handle.opacity().to(0.0, 0.3),
        ring.scale().to(Vec2::new(0.9, 1.3), 0.5).ease(presets::OUT_BACK),
        ring.fill().to(blue.with_alpha(0.0), 0.5),
        ring.line_width().to(46.0, 0.5),
        caption
            .text()
            .to("This page is not here.", 0.8)
            .ease(presets::LINEAR),
    ))
    .await;
    wait_for(1.6).await;

    // Fade out, so the loop starts clean.
    all((
        fours[0].opacity().to(0.0, 0.4),
        fours[1].opacity().to(0.0, 0.4),
        ring.opacity().to(0.0, 0.4),
        caption.opacity().to(0.0, 0.4),
    ))
    .await;
}

pub fn project() -> Project {
    Project::new("not_found").scene(not_found())
}
