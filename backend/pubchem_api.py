import requests

def get_molecule_info(compound_name):
    base_url = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
    search_url = f"{base_url}/compound/name/{compound_name}/JSON"
    
    response = requests.get(search_url)
    if response.status_code == 200:
        data = response.json()
        compound = data['PC_Compounds'][0]
        cid = compound['id']['id']['cid']
        
        properties_url = f"{base_url}/compound/cid/{cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON"
        prop_response = requests.get(properties_url)
        
        if prop_response.status_code == 200:
            prop_data = prop_response.json()
            properties = prop_data['PropertyTable']['Properties'][0]
            
            return {
                "cid": cid,
                "molecular_formula": properties['MolecularFormula'],
                "molecular_weight": properties['MolecularWeight'],
                "canonical_smiles": properties['CanonicalSMILES']
            }
    
    return None

if __name__ == "__main__":
    print(get_molecule_info("caffeine"))