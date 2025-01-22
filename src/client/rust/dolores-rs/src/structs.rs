use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use serde_json::Value;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VideoUpload {
    pub timestamp: String,
    pub title: String, 
    pub fileURI: String
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Video {
    pub timestamp: String,
    pub uuid: String
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Feed {
    pub videos: Vec<Video>
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SuccessResult {
    pub success: bool
}
