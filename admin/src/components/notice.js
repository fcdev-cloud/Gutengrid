export default function Notice( { type, message, onDismiss } ) {
    return (
        <div className={ `notice notice-${ type } is-dismissible gutengrid-admin__notice` }>
            <p>{ message }</p>
            <button
                type="button"
                className="notice-dismiss"
                onClick={ onDismiss }
            />
        </div>
    );
}