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

use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    AGENT_ADDRESS
};
use hdk::holochain_core_types::{
    entry::Entry,
    link::LinkMatch,
    dna::entry_types::Sharing,
};

use hdk::holochain_json_api::{
    json::JsonString,
    error::JsonError
};

use hdk::holochain_persistence_api::{
    cas::content::Address
};

use hdk_proc_macros::zome;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Spot {
    creator_address: Address,
    timestamp: u64,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Question {
    question: String,
    spot_address: Address
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Response {
    question_address: Address,
    agent_address: Address,
    response: i32
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
            }
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
            validation: | _validation_data: hdk::EntryValidationData<Response>| {
                Ok(())
            },
            links: [
                from!(
                    "question",
                    link_type: "from_question",
                    validation_package: || { hdk::ValidationPackageDefinition::Entry },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                )
            ]
        )
    }

    #[zome_fn("hc_public")]
    fn create_spot(timestamp: u64) -> ZomeApiResult<Address> {
        let spot = Spot {
            creator_address: AGENT_ADDRESS.clone(),
            timestamp: timestamp,
        };
        let entry = Entry::App("spot".into(), spot.into());
        let address = hdk::commit_entry(&entry)?;

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
    fn get_spot_questions(spot_address: Address) -> ZomeApiResult<Vec<ZomeApiResult<Entry>>> {
        hdk::get_links_and_load(&spot_address, LinkMatch::Exactly("from_spot"), LinkMatch::Any)
    }

    #[zome_fn("hc_public")]
    fn create_response(response: Response) -> ZomeApiResult<Address> {
        let entry = Entry::App("response".into(), response.clone().into());
        let address = hdk::commit_entry(&entry)?;

        hdk::link_entries(&response.question_address, &address, "from_question", "")?;

        Ok(address)
    }

    #[zome_fn("hc_public")]
    fn get_spot_responses(spot_address: Address) -> ZomeApiResult<Vec<ZomeApiResult<Entry>>> {
        let questions = hdk::get_links(&spot_address, LinkMatch::Exactly("from_spot"), LinkMatch::Any)?;

        Ok(questions.addresses().into_iter().flat_map(|address| 
            hdk::get_links_and_load(&address, LinkMatch::Exactly("from_question"), LinkMatch::Any).unwrap()
        ).collect())
    }

}
