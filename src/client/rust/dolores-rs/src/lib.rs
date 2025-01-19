pub mod structs;

#[cfg(test)]
mod tests;

extern crate url;
use url::form_urlencoded;

use reqwest::{Client, Response};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sessionless::hex::IntoHex;
use sessionless::{Sessionless, Signature};
use std::fs::File;
use std::io::Read;
use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::HashMap;
use std::option::Option;
use urlencoding::encode;
use crate::structs::{Feed, VideoUpload, Video, SuccessResult};

pub struct Dolores {
    base_url: String,
    client: Client,
    pub sessionless: Sessionless,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
pub struct DoloresUser {
    pub pub_key: String,
    pub uuid: String
}

impl Dolores {
    pub fn new(base_url: Option<String>, sessionless: Option<Sessionless>) -> Self {
        Dolores {
            base_url: base_url.unwrap_or("https://dev.dolores.allyabase.com/".to_string()),
            client: Client::new(),
            sessionless: sessionless.unwrap_or(Sessionless::new()),
        }
    }

    async fn get(&self, url: &str) -> Result<Response, reqwest::Error> {
        self.client.get(url).send().await
    }

    async fn post(&self, url: &str, payload: serde_json::Value) -> Result<Response, reqwest::Error> {
        self.client
            .post(url)
            .json(&payload)
            .send()
            .await
    }

    async fn put(&self, url: &str, payload: serde_json::Value) -> Result<Response, reqwest::Error> {
        self.client
            .put(url)
            .json(&payload)
            .send()
            .await
    }

    async fn put_file(&self, url: &str, timestamp: &str, signature: &str, file_uri: &str) -> Result<Response, reqwest::Error> {
	let file_result = File::open(file_uri);
		
	match file_result {
	    Ok(mut file) => {
		let mut buffer = Vec::new();
		if let Err(_) = file.read_to_end(&mut buffer) {
		    return self.client
			.get("http://heyoooo")
			.send()
			.await;
		}
		
		self.client
		    .put(url)
		    .header("x-pn-timestamp", timestamp)
		    .header("x-pn-signature", signature)
                    .multipart(
		        reqwest::multipart::Form::new()
			    .part("video", 
			        reqwest::multipart::Part::bytes(buffer)
				    .file_name("test.mp4") 
				    .mime_str("video/mp4").unwrap() 
			)
                    )
		    .send()
		    .await
	    },
	    Err(_) => {
		self.client
		    .get("http://heyoooo")
		    .send()
		    .await
	    }
	}
    }

    async fn delete(&self, url: &str, payload: serde_json::Value) -> Result<Response, reqwest::Error> {
        self.client
            .delete(url)
            .json(&payload)
            .send()
            .await
    }

    fn get_timestamp() -> String {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_millis()
            .to_string()
    }

    pub async fn create_user(&self) -> Result<DoloresUser, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let pub_key = self.sessionless.public_key().to_hex();
        let signature = self.sessionless.sign(&format!("{}{}", timestamp, pub_key)).to_hex();

        let payload = json!({
            "timestamp": timestamp,
            "pubKey": pub_key,
            "signature": signature
        }).as_object().unwrap().clone();

        let url = format!("{}user/create", self.base_url);
        let res = self.put(&url, serde_json::Value::Object(payload)).await?;
        let user: DoloresUser = res.json().await?;

        Ok(user)
    }

    pub async fn get_user_by_uuid(&self, uuid: &str) -> Result<DoloresUser, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}", timestamp, uuid);
        let signature = self.sessionless.sign(&message).to_hex();

        let url = format!("{}user/{}?timestamp={}&signature={}", self.base_url, uuid, timestamp, signature);
        let res = self.get(&url).await?;
        let user: DoloresUser = res.json().await?;

        Ok(user)
    }

    pub async fn put_video(&self, uuid: &str, title: &str, file_uri: &str) -> Result<SuccessResult, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();      
        let message = format!("{}{}{}", timestamp, uuid, title);    
        let signature = self.sessionless.sign(&message).to_hex();

        let encoded_title: String = encode(title).to_string();

        let url = format!("{}user/{}/short-form/{}/video", self.base_url, uuid, encoded_title);
        let res = self.put_file(&url, &timestamp, &signature, &file_uri).await?;
        let success_result: SuccessResult = res.json().await?;

        Ok(success_result)
    }

    // In Tauri we can just feed the video urls to the web side, and handle caching of videos there. 
/*    pub async fn get_video(&self, uuid: &str, title: &str, closure_for_download: ???) -> Result<SuccessResult, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}{}", timestamp, uuid, title);
        let signature = self.sessionless.sign(&message).to_hex();

        let encoded_title: String = form_urlencoded::byte_serialize(title.as_bytes()).collect();

        // do I need this?
    } */

    pub async fn get_feed(&self, uuid: &str, tags: &str) -> Result<Feed, Box<dyn std::error::Error>> {
        let tags_message = tags.replace("+", "");
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}{}", timestamp, uuid, tags_message);
        let signature = self.sessionless.sign(&message).to_hex();

        let encoded_tags: String = encode(tags).to_string();

        let url = format!("{}user/{}/feed?timestamp={}&signature={}&tags={}", self.base_url, uuid, timestamp, signature, encoded_tags);
        let res = self.get(&url).await?;
        let feed: Feed = res.json().await?;

        Ok(feed)
    }
}
