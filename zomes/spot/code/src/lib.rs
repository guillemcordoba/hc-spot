#![feature(proc_macro_hygiene)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_json_derive;

use hdk::holochain_core_types::{
    dna::entry_types::Sharing, entry::Entry, link::LinkMatch, time::Timeout,
    validation::EntryValidationData,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult, AGENT_ADDRESS};

use hdk::holochain_json_api::{error::JsonError, json::JsonString};

use hdk::holochain_persistence_api::cas::content::Address;

use hdk_proc_macros::zome;
use holochain_wasm_utils::api_serialization::{
    get_entry::{GetEntryOptions, GetEntryResult, StatusRequestKind},
    get_links::GetLinksOptions,
};
use std::convert::TryInto;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Spot {
    pub name: String,
    pub creator_address: Address,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Question {
    pub question: String,
    pub spot_address: Address,
    pub question_type: QuestionType,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub enum QuestionType {
    Range { min: u64, max: u64 },
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Response {
    pub question_address: Address,
    pub agent_address: Address,
    pub response: JsonString,
}

impl QuestionType {
    pub fn validate(&self, response: JsonString) -> Result<(), String> {
        match self.clone() {
            QuestionType::Range { min, max } => {
                let number: u64 = response.try_into()?;
                if number < min || number > max {
                    return Err("Response number is outside the range".into());
                }
                Ok(())
            } // _ => Err("Unknown question type".into())
        }
    }
}

#[zome]
mod spot {

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[entry_def]
    fn anchor_entry_def() -> ValidatingEntryType {
        entry!(
            name: "anchor",
            description: "anchor",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<String>| {
                Ok(())
            }
        )
    }

    #[entry_def]
    fn spot_entry_def() -> ValidatingEntryType {
        entry!(
            name: "spot",
            description: "an event or similar that links to a list of questions",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<Spot>| {
                Ok(())
            },
            links: [
                from!(
                    "anchor",
                    link_type: "from_anchor",
                    validation_package: || { hdk::ValidationPackageDefinition::Entry },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                )
            ]
        )
    }

    #[entry_def]
    fn question_entry_def() -> ValidatingEntryType {
        entry!(
            name: "question",
            description: "a question",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<Question>| {
                Ok(())
            },
            links: [
                from!(
                    "spot",
                    link_type: "from_spot",
                    validation_package: || { hdk::ValidationPackageDefinition::Entry },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                )
            ]
        )
    }

    #[entry_def]
    fn response_entry_def() -> ValidatingEntryType {
        entry!(
            name: "response",
            description: "a response to a question",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: |validation_data: hdk::EntryValidationData<Response>| {
                match validation_data {
                    EntryValidationData::Create { entry: response, validation_data } => {
                        if !validation_data.sources().contains(&response.agent_address) {
                            return Err("Cannot author a response from another agent".into());
                        }

                        let question: Question = hdk::utils::get_as_type(response.question_address)?;
                        question.question_type.validate(response.response)
                    },
                    _ => Err("Update or delete response is not allowed".into())
                }
            },
            links: [
                from!(
                    "question",
                    link_type: "from_question",
                    validation_package: || { hdk::ValidationPackageDefinition::Entry },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                ),
                from!(
                    "%agent_id",
                    link_type: "from_agent",
                    validation_package: || { hdk::ValidationPackageDefinition::Entry },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                )
            ]
        )
    }

    #[zome_fn("hc_public")]
    fn create_spot(name: String, timestamp: u64) -> ZomeApiResult<Address> {
        let anchor_address = hdk::commit_entry(&anchor_entry())?;

        let spot = Spot {
            name: name,
            creator_address: AGENT_ADDRESS.clone(),
            timestamp: timestamp,
        };
        let entry = Entry::App("spot".into(), spot.into());
        let address = hdk::commit_entry(&entry)?;

        hdk::link_entries(&anchor_address, &address, "from_anchor", "")?;

        Ok(address)
    }

    #[zome_fn("hc_public")]
    fn create_question(question: Question) -> ZomeApiResult<Address> {
        let entry = Entry::App("question".into(), question.clone().into());
        let address = hdk::commit_entry(&entry)?;

        hdk::link_entries(&question.spot_address, &address, "from_spot", "")?;

        Ok(address)
    }

    #[zome_fn("hc_public")]
    fn get_spot_questions(
        spot_address: Address,
    ) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
        hdk::get_links_result(
            &spot_address,
            LinkMatch::Exactly("from_spot"),
            LinkMatch::Any,
            GetLinksOptions::default(),
            GetEntryOptions::new(StatusRequestKind::default(), true, true, Timeout::new(5000)),
        )
    }

    #[zome_fn("hc_public")]
    fn get_all_spots() -> ZomeApiResult<Vec<ZomeApiResult<Entry>>> {
        let anchor_address = hdk::entry_address(&anchor_entry())?;
        hdk::get_links_and_load(
            &anchor_address,
            LinkMatch::Exactly("from_spot"),
            LinkMatch::Any,
        )
    }

    #[zome_fn("hc_public")]
    fn create_response(question_address: Address, response: JsonString) -> ZomeApiResult<Address> {
        let response_struct = Response {
            question_address: question_address.clone(),
            response: response,
            agent_address: AGENT_ADDRESS.clone(),
        };
        let entry = Entry::App("response".into(), response_struct.clone().into());
        let address = hdk::commit_entry(&entry)?;

        hdk::link_entries(&question_address, &address, "from_question", "")?;
        hdk::link_entries(&AGENT_ADDRESS, &address, "from_agent", "")?;

        Ok(address)
    }

    #[zome_fn("hc_public")]
    fn get_entry(address: Address) -> ZomeApiResult<Option<Entry>> {
        hdk::get_entry(&address)
    }

    #[zome_fn("hc_public")]
    fn me() -> Address {
        AGENT_ADDRESS.clone()
    }

    #[zome_fn("hc_public")]
    fn get_spot_responses(
        spot_address: Address,
    ) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
        let questions = hdk::get_links(
            &spot_address,
            LinkMatch::Exactly("from_spot"),
            LinkMatch::Any,
        )?;

        Ok(questions
            .addresses()
            .into_iter()
            .flat_map(|address| {
                hdk::get_links_result(
                    &address,
                    LinkMatch::Exactly("from_question"),
                    LinkMatch::Any,
                    GetLinksOptions::default(),
                    GetEntryOptions::new(
                        StatusRequestKind::default(),
                        true,
                        true,
                        Timeout::new(5000),
                    ),
                )
                .unwrap()
            })
            .collect())
    }

}

fn anchor_entry() -> Entry {
    Entry::App("anchor".into(), "anchor".into())
}
