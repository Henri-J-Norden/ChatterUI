import { ColorId } from '@constants/Style'
import { MaterialIcons } from '@expo/vector-icons'
import { Chats, Style } from '@globals'
import { useState } from 'react'
import {
    GestureResponderEvent,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { useShallow } from 'zustand/react/shallow'

type EditorButtonProps = {
    name: 'delete' | 'check' | 'close'
    color: ColorId
    onPress: () => void
}

const EditorButton = ({ name, onPress, color }: EditorButtonProps) => (
    <TouchableOpacity style={styles.editButton} onPress={onPress}>
        <MaterialIcons name={name} size={32} color={Style.getColor(color)} />
    </TouchableOpacity>
)

type EditorProps = {
    id: number
    isLastMessage: boolean
    setEditMode: React.Dispatch<React.SetStateAction<boolean>>
    editMode: boolean
}

type FadeScreenProps = {
    handleOverlayClick: (e: GestureResponderEvent) => void
}
const FadeScreen: React.FC<FadeScreenProps> = ({ handleOverlayClick }) => {
    return (
        <TouchableOpacity activeOpacity={1} onPress={handleOverlayClick} style={styles.absolute} />
    )
}

const EditorModal: React.FC<EditorProps> = ({ id, isLastMessage, setEditMode, editMode }) => {
    const { updateChat, deleteChat } = Chats.useChat(
        useShallow((state) => ({
            updateChat: state.updateEntry,
            deleteChat: state.deleteEntry,
        }))
    )
    const message = Chats.useChat((state) => state?.data?.messages?.[id])

    const [placeholderText, setPlaceholderText] = useState(
        message?.swipes[message?.swipe_id]?.swipe ?? ''
    )

    const handleEditMessage = () => {
        updateChat(id, placeholderText, false)
        setEditMode(false)
    }

    const handleDeleteMessage = () => {
        deleteChat(id)
        setEditMode(false)
    }

    const handleClose = () => {
        setEditMode(false)
    }

    const handleOverlayClick = (e: GestureResponderEvent) => {
        if (e.target === e.currentTarget) handleClose()
    }

    return (
        <View>
            <Modal
                visible={editMode}
                animationType="fade"
                transparent
                onRequestClose={handleClose}
                style={{ flex: 1 }}>
                <FadeScreen handleOverlayClick={handleOverlayClick} />
                <View style={{ flex: 1 }} />
                <View style={styles.topText}>
                    <Text style={styles.nameText}>{message?.name}</Text>
                    <Text style={styles.timeText}>
                        {message?.swipes[message.swipe_id].send_date.toLocaleTimeString()}
                    </Text>
                </View>
                <View style={styles.editorContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <EditorButton
                            name="delete"
                            onPress={handleDeleteMessage}
                            color="destructive-brand"
                        />
                        <TextInput
                            style={styles.messageInput}
                            value={placeholderText}
                            onChangeText={setPlaceholderText}
                            textBreakStrategy="simple"
                            multiline
                        />
                        <EditorButton
                            name="check"
                            onPress={handleEditMessage}
                            color="primary-text1"
                        />
                    </View>
                </View>
            </Modal>
        </View>
    )
}

export default EditorModal

const styles = StyleSheet.create({
    absolute: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    editorContainer: {
        backgroundColor: Style.getColor('primary-surface2'),
        paddingTop: 4,
        maxHeight: '70%',
        paddingVertical: 12,
    },

    topText: {
        flexDirection: 'row',
        padding: 8,
        alignItems: 'flex-end',
        shadowColor: Style.getColor('primary-shadow'),
        backgroundColor: Style.getColor('primary-surface2'),
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
    },

    nameText: {
        color: Style.getColor('primary-text1'),
        fontSize: 18,
        marginLeft: 40,
    },

    timeText: {
        color: Style.getColor('primary-text2'),
        fontSize: 12,
        marginLeft: 8,
    },

    editButton: {
        padding: 4,
        paddingVertical: 12,
    },

    messageInput: {
        color: Style.getColor('primary-text1'),
        backgroundColor: Style.getColor('primary-surface1'),
        borderColor: Style.getColor('primary-brand'),
        borderWidth: 1,
        minHeight: 32,
        borderRadius: 8,
        padding: 8,
        flex: 1,
    },
})
