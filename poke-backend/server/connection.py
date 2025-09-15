from composio import Composio
import os

def get_connection(
    connection_id: str,
    user_id: str,
    composio_client: Composio,
):
    return composio_client.connected_accounts.get(
        user_id,
    )

def initiate_connection(
    user_id: str,
    composio_client: Composio,
    auth_config_id: str = None, 
):
    if not auth_config_id:
        auth_config_id = os.getenv("COMPOSIO_AUTH_CONFIG_ID", "gmail")
    
    print(f"Debug: Initiating connection with auth_config_id: {auth_config_id}, user_id: {user_id}")
    
    try:
        connected_account = composio_client.connected_accounts.initiate(
            user_id=user_id, 
            auth_config_id=auth_config_id
        )
        print(f"Debug: Connection initiated successfully")
        return connected_account
    except Exception as e:
        print(f"Debug: Connection failed with error: {e}")
        print(f"Debug: Error type: {type(e).__name__}")
        raise e

def wait_for_connection(
    connected_account_id: str,
    composio_client: Composio,
):
    return composio_client.connected_accounts.wait_for_connection(
        connected_account_id
    )

def get_connection_status(
    connected_account_id: str,
    composio_client: Composio,
):
    return composio_client.connected_accounts.get(
        nanoid=connected_account_id
    )