use oxframe::prelude::*;

/// One row of the CSV, passed in by the loop that renders it.
fn field(name: &str) -> String {
    std::env::var(name).unwrap_or_default()
}

#[oxframe::scene]
pub async fn card(view: View) {
    let title = view.add(TitleCard::new(format!("Thank you, {}", field("NAME"))).subtitle(format!(
        "{} pull requests merged this year",
        field("PRS")
    )));
    title.enter().await;
    title.next().await;
    wait_for(1.5).await;
}

pub fn project() -> Project {
    Project::new("thanks").scene(card())
}
