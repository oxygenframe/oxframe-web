use oxframe::prelude::*;

#[oxframe::scene]
pub async fn card(view: View) {
    // Revideo's variables: here the environment (or a file you read).
    let name = std::env::var("NAME").unwrap_or_else(|_| "Ada".into());
    let title = view.add(Txt::new().text(format!("Welcome, {name}")).display().opacity(0.0));
    title.opacity().to(1.0, 0.5).await;
    wait_for(1.5).await;
}

pub fn project() -> Project {
    Project::new("welcome").scene(card())
}
