Native backups use public.native_app_state with owner-only RLS. Prototype public.app_state remains separate and is only read by the import action.

Optional automatic backups serialize uploads and require the account that enabled them. Restores disable automatic backup and validate record references. Prototype imports merge records into the native workspace and skip previously imported IDs. Neither import route changes prototype cloud data.

Native JSON restore retains a recovery snapshot at AsyncStorage key forsyth-business-recovery. JSON and cloud backups embed document photos, expense receipts and selected logos as image data rather than temporary device paths. Prototype data-URL receipt images are preserved. Native device testing must confirm file conversion and restoration on another device.

Signed-in end-to-end testing on the user's account and native device verification remain release gates. Browser preview tests do not validate iOS Contacts, file sharing, PDF printing or image picking.
