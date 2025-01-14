use crate::{DoloresUser, Dolores, SuccessResult};
use sessionless::hex::IntoHex;
use sessionless::hex::FromHex;
use sessionless::{Sessionless, PrivateKey};
use std::collections::HashMap;
use serde_json::json;
use serde_json::Value;

#[actix_rt::test]
async fn test_dolores() {

    let mut saved_user: Option<DoloresUser>;
    let dolores = Dolores::new(Some("http://localhost:3006/".to_string()), None);

    async fn create_user(dolores: &Dolores) -> Option<DoloresUser> {
    println!("creating user");
        let result = dolores.create_user().await;
    println!("got to here");

        match result {
            Ok(user) => {
                println!("Successfully got DoloresUser: {}", user.uuid);
                assert_eq!(
                    user.uuid.len(),
                    36
                );
                Some(user)
            },
            Err(error) => {
                eprintln!("Error occurred create_user: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn get_user_by_uuid(dolores: &Dolores, saved_user: &DoloresUser) -> Option<DoloresUser> {
        let result = dolores.get_user_by_uuid(&saved_user.uuid).await;

        match result {
            Ok(user) => {
                assert_eq!(
                    user.uuid.len(),
                    36
                );
                Some(user)
            }
            Err(error) => {
                eprintln!("Error occurred get_user: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn put_mp4_video(dolores: &Dolores, saved_user: &DoloresUser) -> Option<SuccessResult> {
        let title = "My rust video".to_string();
        let file_uri = "test.mp4".to_string();

        let result = dolores.put_video(&saved_user.uuid, &title, &file_uri).await;

        match result {
            Ok(success) => {
                assert_eq!(
                    success.success,
                    true
                );
                Some(success)
            }
            Err(error) => {
                eprintln!("Error occurred putting video: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn put_mov_video(dolores: &Dolores, saved_user: &DoloresUser) -> Option<SuccessResult> {
        let title = "My rust mov".to_string();
        let file_uri = "test.mov".to_string();

        let result = dolores.put_video(&saved_user.uuid, &title, &file_uri).await;

        match result {
            Ok(success) => {
                assert_eq!(
                    success.success,
                    true
                );
                Some(success)
            }
            Err(error) => {
                eprintln!("Error occurred putting video: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn get_video(dolores: &Dolores, saved_user: &DoloresUser) -> Option<Video> {
        let title = "My rust mov".to_string();
        
        let result = dolores.get_video(&saved_user.uuid, &title, ???).await;

        // this depends on storing the vide
    }

    async fn get_feed(dolores: &Dolores, saved_user: &DoloresUser) -> Option<Feed> {
        let result = dolores.get_feed(&saved_user.uuid).await;

        match result {
            Ok(feed) => {
                assert!(feed.titles.len() >= 2);
                Some(feed)
            }
            Err(error) => {
                eprintln!("Error occurred getting feed: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    saved_user = Some(create_user(&fount).await.expect("user"));

    if let Some(ref user) = saved_user {
        saved_user = Some(get_user_by_uuid(&dolores, user).await.expect("get user"));
    } else {
        panic!("Failed to get user");
    }

    Some(put_mp4_video(&dolores, &saved_user).await.expect("put mp4"));
    Some(put_mov_video(&dolores, &saved_user).await.expect("put mov"));
    Some(get_feed(&dolores, &saved_user).await.expect("get feed"));
}

